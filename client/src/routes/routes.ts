import { defineRoute } from '@tsquid/routes/entrypoint';
import * as Route from './__generated__/routes';
import { ADMIN_PAGE_ENTRY_POINT } from '../components/admin-page/AdminPage.entrypoint';
import { ADMIN_PAGE_ITEM_ENTRY_POINT } from '../components/admin-page-item/AdminPageItem.entrypoint';
import { ADMIN_USER_ENTRY_POINT } from '../components/admin-user/AdminUser.entrypoint';
import { ADMIN_ENTRY_POINT } from '../components/admin/Admin.entrypoint';
import { HOME_ENTRY_POINT } from '../components/home/Home.entrypoint';
import { LOGIN_ENTRY_POINT } from '../components/login/Login.entrypoint';
import { PAGE_ENTRY_POINT } from '../components/page/Page.entrypoint';
import { PAGE_ITEM_ENTRY_POINT } from '../components/page-item/PageItem.entrypoint';

export const ROUTES = {
  Home: defineRoute({ uri: Route.HomeURI, context: Route.HomeRouteContext, entryPoint: HOME_ENTRY_POINT }),
  Page: defineRoute({ uri: Route.PageURI, context: Route.PageRouteContext, entryPoint: PAGE_ENTRY_POINT }),
  PageItem: defineRoute({ uri: Route.PageItemURI, context: Route.PageItemRouteContext, entryPoint: PAGE_ITEM_ENTRY_POINT }),
  Login: defineRoute({ uri: Route.LoginURI, context: Route.LoginRouteContext, entryPoint: LOGIN_ENTRY_POINT }),
  AdminHome: defineRoute({ uri: Route.AdminHomeURI, context: Route.AdminHomeRouteContext, entryPoint: ADMIN_ENTRY_POINT }),
  AdminPageList: defineRoute({ uri: Route.AdminPageListURI, context: Route.AdminPageListRouteContext, entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPageCreate: defineRoute({ uri: Route.AdminPageCreateURI, context: Route.AdminPageCreateRouteContext, entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPageDetail: defineRoute({ uri: Route.AdminPageDetailURI, context: Route.AdminPageDetailRouteContext, entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPageEdit: defineRoute({ uri: Route.AdminPageEditURI, context: Route.AdminPageEditRouteContext, entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPageItemList: defineRoute({ uri: Route.AdminPageItemListURI, context: Route.AdminPageItemListRouteContext, entryPoint: ADMIN_PAGE_ITEM_ENTRY_POINT }),
  AdminPageItemCreate: defineRoute({ uri: Route.AdminPageItemCreateURI, context: Route.AdminPageItemCreateRouteContext, entryPoint: ADMIN_PAGE_ITEM_ENTRY_POINT }),
  AdminPageItemDetail: defineRoute({ uri: Route.AdminPageItemDetailURI, context: Route.AdminPageItemDetailRouteContext, entryPoint: ADMIN_PAGE_ITEM_ENTRY_POINT }),
  AdminPageItemEdit: defineRoute({ uri: Route.AdminPageItemEditURI, context: Route.AdminPageItemEditRouteContext, entryPoint: ADMIN_PAGE_ITEM_ENTRY_POINT }),
  AdminUserDetail: defineRoute({ uri: Route.AdminUserDetailURI, context: Route.AdminUserDetailRouteContext, entryPoint: ADMIN_USER_ENTRY_POINT }),
  AdminUserEdit: defineRoute({ uri: Route.AdminUserEditURI, context: Route.AdminUserEditRouteContext, entryPoint: ADMIN_USER_ENTRY_POINT }),
};
