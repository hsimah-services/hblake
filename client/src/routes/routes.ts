import { defineRoute } from '@tsquid/routes/entrypoint';
import * as Route from './__generated__/routes';
import { ADMIN_PAGE_ENTRY_POINT } from '../components/admin-page/AdminPage.entrypoint';
import { ADMIN_POST_ENTRY_POINT } from '../components/admin-post/AdminPost.entrypoint';
import { ADMIN_PRODUCT_ENTRY_POINT } from '../components/admin-product/AdminProduct.entrypoint';
import { ADMIN_USER_ENTRY_POINT } from '../components/admin-user/AdminUser.entrypoint';
import { ADMIN_ENTRY_POINT } from '../components/admin/Admin.entrypoint';
import { HOME_ENTRY_POINT } from '../components/home/Home.entrypoint';
import { LOGIN_ENTRY_POINT } from '../components/login/Login.entrypoint';
import { PAGE_ENTRY_POINT } from '../components/page/Page.entrypoint';
import { POST_ENTRY_POINT } from '../components/post/Post.entrypoint';
import { PRODUCT_ENTRY_POINT } from '../components/product/Product.entrypoint';

export const ROUTES = {
  Home: defineRoute({ uri: Route.HomeURI, context: Route.HomeRouteContext, entryPoint: HOME_ENTRY_POINT }),
  Page: defineRoute({ uri: Route.PageURI, context: Route.PageRouteContext, entryPoint: PAGE_ENTRY_POINT }),
  PostList: defineRoute({ uri: Route.PostListURI, context: Route.PostListRouteContext, entryPoint: POST_ENTRY_POINT }),
  Post: defineRoute({ uri: Route.PostURI, context: Route.PostRouteContext, entryPoint: POST_ENTRY_POINT }),
  ProductList: defineRoute({ uri: Route.ProductListURI, context: Route.ProductListRouteContext, entryPoint: PRODUCT_ENTRY_POINT }),
  Product: defineRoute({ uri: Route.ProductURI, context: Route.ProductRouteContext, entryPoint: PRODUCT_ENTRY_POINT }),
  Login: defineRoute({ uri: Route.LoginURI, context: Route.LoginRouteContext, entryPoint: LOGIN_ENTRY_POINT }),
  AdminHome: defineRoute({ uri: Route.AdminHomeURI, context: Route.AdminHomeRouteContext, entryPoint: ADMIN_ENTRY_POINT }),
  AdminPageList: defineRoute({ uri: Route.AdminPageListURI, context: Route.AdminPageListRouteContext, entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPageCreate: defineRoute({ uri: Route.AdminPageCreateURI, context: Route.AdminPageCreateRouteContext, entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPageDetail: defineRoute({ uri: Route.AdminPageDetailURI, context: Route.AdminPageDetailRouteContext, entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPageEdit: defineRoute({ uri: Route.AdminPageEditURI, context: Route.AdminPageEditRouteContext, entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPostList: defineRoute({ uri: Route.AdminPostListURI, context: Route.AdminPostListRouteContext, entryPoint: ADMIN_POST_ENTRY_POINT }),
  AdminPostCreate: defineRoute({ uri: Route.AdminPostCreateURI, context: Route.AdminPostCreateRouteContext, entryPoint: ADMIN_POST_ENTRY_POINT }),
  AdminPostDetail: defineRoute({ uri: Route.AdminPostDetailURI, context: Route.AdminPostDetailRouteContext, entryPoint: ADMIN_POST_ENTRY_POINT }),
  AdminPostEdit: defineRoute({ uri: Route.AdminPostEditURI, context: Route.AdminPostEditRouteContext, entryPoint: ADMIN_POST_ENTRY_POINT }),
  AdminProductList: defineRoute({ uri: Route.AdminProductListURI, context: Route.AdminProductListRouteContext, entryPoint: ADMIN_PRODUCT_ENTRY_POINT }),
  AdminProductCreate: defineRoute({ uri: Route.AdminProductCreateURI, context: Route.AdminProductCreateRouteContext, entryPoint: ADMIN_PRODUCT_ENTRY_POINT }),
  AdminProductDetail: defineRoute({ uri: Route.AdminProductDetailURI, context: Route.AdminProductDetailRouteContext, entryPoint: ADMIN_PRODUCT_ENTRY_POINT }),
  AdminProductEdit: defineRoute({ uri: Route.AdminProductEditURI, context: Route.AdminProductEditRouteContext, entryPoint: ADMIN_PRODUCT_ENTRY_POINT }),
  AdminUserDetail: defineRoute({ uri: Route.AdminUserDetailURI, context: Route.AdminUserDetailRouteContext, entryPoint: ADMIN_USER_ENTRY_POINT }),
  AdminUserEdit: defineRoute({ uri: Route.AdminUserEditURI, context: Route.AdminUserEditRouteContext, entryPoint: ADMIN_USER_ENTRY_POINT }),
};
