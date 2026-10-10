"""Operator procedures and destructive checks, run on the host after the Playwright suite.

These need the harness scripts in scripts/acceptance/ (see tests/README.md) and change
global state: they lock the operator out, expire sessions and trip the login rate limit.
Tests run in name order; the rate limit is last because it may block further logins.

Standard library only:  python3 -I tests/ops/test_ops.py
"""

from __future__ import annotations

import http.cookiejar
import json
import os
import subprocess
import tempfile
import time
import unittest
import urllib.error
import urllib.request
import uuid

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
HARNESS = os.path.join(ROOT, "scripts", "acceptance")
BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080").rstrip("/")
EMAIL = os.environ.get("ADMIN_EMAIL", "")
PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
RUN = uuid.uuid4().hex[:8]


def harness(name: str, *args: str, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    path = os.path.join(HARNESS, name)
    if not os.access(path, os.X_OK):
        raise AssertionError(f"missing harness script scripts/acceptance/{name}")
    return subprocess.run(
        [path, *args],
        cwd=ROOT,
        env={**os.environ, **(env or {})},
        capture_output=True,
        text=True,
        timeout=600,
    )


class Client:
    """One cookie jar: GET /auth/csrf, POST /auth/login|logout and POST /graphql."""

    def __init__(self) -> None:
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        self.token: str | None = None

    def request(self, method: str, path: str, body: object | None = None, headers: dict[str, str] | None = None):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(BASE_URL + path, data=data, method=method)
        req.add_header("content-type", "application/json")
        for key, value in (headers or {}).items():
            req.add_header(key, value)
        try:
            with self.opener.open(req, timeout=30) as response:
                return response.status, response.read().decode()
        except urllib.error.HTTPError as error:
            return error.code, error.read().decode()

    def csrf(self) -> str:
        status, body = self.request("GET", "/auth/csrf")
        assert status == 200, f"GET /auth/csrf returned {status}: {body}"
        self.token = json.loads(body)["token"]
        return self.token

    def login(self, email: str = EMAIL, password: str = PASSWORD) -> int:
        status, _ = self.request("POST", "/auth/login", {"email": email, "password": password}, {"X-CSRF-Token": self.csrf()})
        self.token = None
        return status

    def graphql(self, query: str, variables: dict | None = None) -> dict:
        headers = {}
        if query.lstrip().startswith("mutation"):
            headers["X-CSRF-Token"] = self.token or self.csrf()
        status, body = self.request("POST", "/graphql", {"query": query, "variables": variables or {}}, headers)
        try:
            payload = json.loads(body)
        except ValueError:
            payload = {}
        payload["_status"] = status
        return payload

    def viewer(self) -> dict | None:
        return (self.graphql("query { viewer { id displayName role } }").get("data") or {}).get("viewer")

    def create_page(self, slug: str, title: str) -> dict:
        return self.graphql(
            "mutation($input: CreatePageInput!) { createPage(input: $input) { page { id slug status } } }",
            {"input": {"title": title, "slug": slug, "content": f"Body of {title}."}},
        )

    def page(self, slug: str) -> dict | None:
        result = self.graphql("query($slug: String!) { pageBySlug(slug: $slug) { id slug title status } }", {"slug": slug})
        return (result.get("data") or {}).get("pageBySlug")


def rejected(result: dict) -> bool:
    return result["_status"] >= 400 or bool(result.get("errors"))


def operator() -> Client:
    client = Client()
    status = client.login()
    assert status == 200, f"operator login returned {status}"
    return client


class OperatorProcedures(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if not EMAIL or not PASSWORD:
            raise unittest.SkipTest("ADMIN_EMAIL and ADMIN_PASSWORD must be set; run tests/run.sh")

    def test_10_bootstrap_refuses_a_second_account(self) -> None:
        other = f"second-{RUN}@example.test"
        result = harness("bootstrap", env={"ADMIN_EMAIL": other, "ADMIN_PASSWORD": "second-account-password", "ADMIN_DISPLAY_NAME": "Second"})
        self.assertNotEqual(result.returncode, 0, f"bootstrap must refuse when an account exists:\n{result.stdout}{result.stderr}")
        self.assertEqual(Client().login(other, "second-account-password"), 401)
        self.assertEqual(Client().login(), 200, "the original operator still signs in")

    def test_20_installer_refuses_a_populated_database(self) -> None:
        client = operator()
        slug = f"install-guard-{RUN}"
        self.assertFalse(rejected(client.create_page(slug, "Install guard")))
        result = harness("install")
        self.assertNotEqual(result.returncode, 0, f"the initial installer must refuse a populated database:\n{result.stdout}{result.stderr}")
        self.assertIsNotNone(operator().page(slug), "existing content survives the refused install")

    def test_30_backup_and_restore_round_trip(self) -> None:
        client = operator()
        slug = f"backup-{RUN}"
        created = client.create_page(slug, "Backed up")
        self.assertFalse(rejected(created), created)
        page_id = created["data"]["createPage"]["page"]["id"]

        with tempfile.TemporaryDirectory() as directory:
            backup = os.path.join(directory, "backup")
            result = harness("backup", backup)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertTrue(os.path.exists(backup), "backup wrote the requested path")

            deleted = client.graphql("mutation($input: DeletePageInput!) { deletePage(input: $input) { deletedId } }", {"input": {"id": page_id}})
            self.assertFalse(rejected(deleted), deleted)
            self.assertIsNone(client.page(slug))

            result = harness("restore", backup)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

        restored = operator().page(slug)
        self.assertIsNotNone(restored, "restore brings back content deleted after the backup")
        self.assertEqual(restored["title"], "Backed up")

    def test_40_expired_sessions_cannot_use_the_api(self) -> None:
        client = operator()
        self.assertIsNotNone(client.viewer())
        result = harness("expire-sessions")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIsNone(client.viewer(), "an expired session is anonymous")
        self.assertTrue(rejected(client.create_page(f"expired-{RUN}", "Expired")), "an expired session cannot write")
        self.assertIsNone(operator().page(f"expired-{RUN}"))

    def test_50_an_inactive_operator_cannot_sign_in_or_act(self) -> None:
        client = operator()
        try:
            result = harness("set-active", "false")
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIsNone(client.viewer(), "an existing session stops working once the account is inactive")
            self.assertTrue(rejected(client.create_page(f"inactive-{RUN}", "Inactive")))
            wrong = Client().login(EMAIL, PASSWORD + "-wrong")
            inactive = Client().login()
            self.assertEqual(inactive, 401, "inactive accounts get the generic login failure")
            self.assertEqual(wrong, inactive)
        finally:
            result = harness("set-active", "true")
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIsNone(operator().page(f"inactive-{RUN}"))

    def test_90_login_attempts_are_rate_limited(self) -> None:
        client = Client()
        statuses = [client.login(f"limit-{RUN}@example.test", "wrong-password") for _ in range(30)]
        self.assertIn(429, statuses, f"30 failed logins never returned 429: {statuses}")
        first = statuses.index(429)
        self.assertGreater(first, 0, "the first attempt of a fresh email is not already blocked")
        self.assertTrue(all(status == 401 for status in statuses[:first]), statuses)


if __name__ == "__main__":
    unittest.main(verbosity=2)
