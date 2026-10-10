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
  Home: defineRoute({ uri: Route.HomeURI, context: Route.HomeRouteContext, getRouteType: () => ({ mode: 'home', kind: 'Page' }), entryPoint: HOME_ENTRY_POINT }),
  Page: defineRoute({ uri: Route.PageURI, context: Route.PageRouteContext, getRouteType: (input) => ({ mode: 'public', kind: 'Page', ...input }), entryPoint: PAGE_ENTRY_POINT }),
  PostList: defineRoute({ uri: Route.PostListURI, context: Route.PostListRouteContext, getRouteType: (input) => ({ mode: 'list', kind: 'Post', ...input }), entryPoint: POST_ENTRY_POINT }),
  Post: defineRoute({ uri: Route.PostURI, context: Route.PostRouteContext, getRouteType: (input) => ({ mode: 'public', kind: 'Post', ...input }), entryPoint: POST_ENTRY_POINT }),
  ProductList: defineRoute({ uri: Route.ProductListURI, context: Route.ProductListRouteContext, getRouteType: (input) => ({ mode: 'list', kind: 'Product', ...input }), entryPoint: PRODUCT_ENTRY_POINT }),
  Product: defineRoute({ uri: Route.ProductURI, context: Route.ProductRouteContext, getRouteType: (input) => ({ mode: 'public', kind: 'Product', ...input }), entryPoint: PRODUCT_ENTRY_POINT }),
  Login: defineRoute({ uri: Route.LoginURI, context: Route.LoginRouteContext, getRouteType: () => ({ mode: 'login', kind: '' }), entryPoint: LOGIN_ENTRY_POINT }),
  AdminHome: defineRoute({ uri: Route.AdminHomeURI, context: Route.AdminHomeRouteContext, getRouteType: () => ({ mode: 'admin', kind: '' }), entryPoint: ADMIN_ENTRY_POINT }),
  AdminPageList: defineRoute({ uri: Route.AdminPageListURI, context: Route.AdminPageListRouteContext, getRouteType: (input) => ({ mode: 'list', kind: 'Page', ...input }), entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPageCreate: defineRoute({ uri: Route.AdminPageCreateURI, context: Route.AdminPageCreateRouteContext, getRouteType: () => ({ mode: 'create', kind: 'Page' }), entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPageDetail: defineRoute({ uri: Route.AdminPageDetailURI, context: Route.AdminPageDetailRouteContext, getRouteType: (input) => ({ mode: 'detail', kind: 'Page', ...input }), entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPageEdit: defineRoute({ uri: Route.AdminPageEditURI, context: Route.AdminPageEditRouteContext, getRouteType: (input) => ({ mode: 'edit', kind: 'Page', ...input }), entryPoint: ADMIN_PAGE_ENTRY_POINT }),
  AdminPostList: defineRoute({ uri: Route.AdminPostListURI, context: Route.AdminPostListRouteContext, getRouteType: (input) => ({ mode: 'list', kind: 'Post', ...input }), entryPoint: ADMIN_POST_ENTRY_POINT }),
  AdminPostCreate: defineRoute({ uri: Route.AdminPostCreateURI, context: Route.AdminPostCreateRouteContext, getRouteType: () => ({ mode: 'create', kind: 'Post' }), entryPoint: ADMIN_POST_ENTRY_POINT }),
  AdminPostDetail: defineRoute({ uri: Route.AdminPostDetailURI, context: Route.AdminPostDetailRouteContext, getRouteType: (input) => ({ mode: 'detail', kind: 'Post', ...input }), entryPoint: ADMIN_POST_ENTRY_POINT }),
  AdminPostEdit: defineRoute({ uri: Route.AdminPostEditURI, context: Route.AdminPostEditRouteContext, getRouteType: (input) => ({ mode: 'edit', kind: 'Post', ...input }), entryPoint: ADMIN_POST_ENTRY_POINT }),
  AdminProductList: defineRoute({ uri: Route.AdminProductListURI, context: Route.AdminProductListRouteContext, getRouteType: (input) => ({ mode: 'list', kind: 'Product', ...input }), entryPoint: ADMIN_PRODUCT_ENTRY_POINT }),
  AdminProductCreate: defineRoute({ uri: Route.AdminProductCreateURI, context: Route.AdminProductCreateRouteContext, getRouteType: () => ({ mode: 'create', kind: 'Product' }), entryPoint: ADMIN_PRODUCT_ENTRY_POINT }),
  AdminProductDetail: defineRoute({ uri: Route.AdminProductDetailURI, context: Route.AdminProductDetailRouteContext, getRouteType: (input) => ({ mode: 'detail', kind: 'Product', ...input }), entryPoint: ADMIN_PRODUCT_ENTRY_POINT }),
  AdminProductEdit: defineRoute({ uri: Route.AdminProductEditURI, context: Route.AdminProductEditRouteContext, getRouteType: (input) => ({ mode: 'edit', kind: 'Product', ...input }), entryPoint: ADMIN_PRODUCT_ENTRY_POINT }),
  AdminUserDetail: defineRoute({ uri: Route.AdminUserDetailURI, context: Route.AdminUserDetailRouteContext, getRouteType: (input) => ({ mode: 'detail', kind: 'User', ...input }), entryPoint: ADMIN_USER_ENTRY_POINT }),
  AdminUserEdit: defineRoute({ uri: Route.AdminUserEditURI, context: Route.AdminUserEditRouteContext, getRouteType: (input) => ({ mode: 'edit', kind: 'User', ...input }), entryPoint: ADMIN_USER_ENTRY_POINT }),
};
