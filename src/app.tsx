function getComponent() {
  const route = window.location.pathname;
  
  switch (route) {
    case '/':
      return <hb-feed />;
    default:
      return <hb-blog-post />;
  }
}

export default function app() {
  const route = window.location.pathname;

  return (
    <div className="layout">
      <hb-header current-path={route} />
      <main className="layout-main">{getComponent()}</main>
    </div>
  );
}
