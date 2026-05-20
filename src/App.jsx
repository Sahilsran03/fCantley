import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

const AddProduct = lazy(() => import("./pages/AddProduct.jsx"));
const AccountDashboard = lazy(() => import("./pages/AccountDashboard.jsx"));
const AddressBook = lazy(() => import("./pages/AddressBook.jsx"));
const AdminAnnouncements = lazy(() => import("./pages/AdminAnnouncements.jsx"));
const AdminTwoFactor = lazy(() => import("./pages/AdminTwoFactor.jsx"));
const AdminBlog = lazy(() => import("./pages/AdminBlog.jsx"));
const AdminBlogEditor = lazy(() => import("./pages/AdminBlogEditor.jsx"));
const AdminCategories = lazy(() => import("./pages/AdminCategories.jsx"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons.jsx"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers.jsx"));
const AdminCmsPages = lazy(() => import("./pages/AdminCmsPages.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const AdminDesigns = lazy(() => import("./pages/AdminDesigns.jsx"));
const AdminFaqs = lazy(() => import("./pages/AdminFaqs.jsx"));
const AdminLookbook = lazy(() => import("./pages/AdminLookbook.jsx"));
const AdminLookbookEditor = lazy(() => import("./pages/AdminLookbookEditor.jsx"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications.jsx"));
const AdminOffers = lazy(() => import("./pages/AdminOffers.jsx"));
const AdminOrderDetails = lazy(() => import("./pages/AdminOrderDetails.jsx"));
const AdminPageEditor = lazy(() => import("./pages/AdminPageEditor.jsx"));
const AdminPolicies = lazy(() => import("./pages/AdminPolicies.jsx"));
const AdminOrders = lazy(() => import("./pages/AdminOrders.jsx"));
const AdminProducts = lazy(() => import("./pages/AdminProducts.jsx"));
const AdminQuotes = lazy(() => import("./pages/AdminQuotes.jsx"));
const AdminReviews = lazy(() => import("./pages/AdminReviews.jsx"));
const AdminReturnDetails = lazy(() => import("./pages/AdminReturnDetails.jsx"));
const AdminReturns = lazy(() => import("./pages/AdminReturns.jsx"));
const AdminRewards = lazy(() => import("./pages/AdminRewards.jsx"));
const AdminShippingZones = lazy(() => import("./pages/AdminShippingZones.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Blog = lazy(() => import("./pages/Blog.jsx"));
const BlogDetails = lazy(() => import("./pages/BlogDetails.jsx"));
const BulkOrders = lazy(() => import("./pages/BulkOrders.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const CustomerAnalytics = lazy(() => import("./pages/CustomerAnalytics.jsx"));
const DesignStudio = lazy(() => import("./pages/DesignStudio.jsx"));
const EditProduct = lazy(() => import("./pages/EditProduct.jsx"));
const Faq = lazy(() => import("./pages/Faq.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Lookbook = lazy(() => import("./pages/Lookbook.jsx"));
const LookbookDetails = lazy(() => import("./pages/LookbookDetails.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const MyDesigns = lazy(() => import("./pages/MyDesigns.jsx"));
const MyOrders = lazy(() => import("./pages/MyOrders.jsx"));
const MyQuotes = lazy(() => import("./pages/MyQuotes.jsx"));
const MyReviews = lazy(() => import("./pages/MyReviews.jsx"));
const MyRewards = lazy(() => import("./pages/MyRewards.jsx"));
const MyReturnRequests = lazy(() => import("./pages/MyReturnRequests.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const Notifications = lazy(() => import("./pages/Notifications.jsx"));
const OrderDetails = lazy(() => import("./pages/OrderDetails.jsx"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess.jsx"));
const ProductAnalytics = lazy(() => import("./pages/ProductAnalytics.jsx"));
const ProductDetails = lazy(() => import("./pages/ProductDetails.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit.jsx"));
const PublicCmsPage = lazy(() => import("./pages/PublicCmsPage.jsx"));
const PublicPolicyPage = lazy(() => import("./pages/PublicPolicyPage.jsx"));
const RecentlyViewed = lazy(() => import("./pages/RecentlyViewed.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ReturnRequest = lazy(() => import("./pages/ReturnRequest.jsx"));
const ReturnRequestDetails = lazy(() => import("./pages/ReturnRequestDetails.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const RewardAnalytics = lazy(() => import("./pages/RewardAnalytics.jsx"));
const RewardUpload = lazy(() => import("./pages/RewardUpload.jsx"));
const SalesAnalytics = lazy(() => import("./pages/SalesAnalytics.jsx"));
const SavedDesigns = lazy(() => import("./pages/SavedDesigns.jsx"));
const Shop = lazy(() => import("./pages/Shop.jsx"));
const TrackOrder = lazy(() => import("./pages/TrackOrder.jsx"));
const TrackOrderLookup = lazy(() => import("./pages/TrackOrderLookup.jsx"));
const VerifyOtp = lazy(() => import("./pages/VerifyOtp.jsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.jsx"));

const App = () => (
  <Suspense fallback={<main className="site-main"><div className="page-loading">Loading Cantley...</div></main>}>
    <Routes>
    <Route element={<MainLayout />}>
      <Route index element={<Home />} />
      <Route path="shop" element={<Shop />} />
      <Route path="bulk-orders" element={<BulkOrders />} />
      <Route path="blog" element={<Blog />} />
      <Route path="blog/:slug" element={<BlogDetails />} />
      <Route path="lookbook" element={<Lookbook />} />
      <Route path="lookbook/:slug" element={<LookbookDetails />} />
      <Route path="about" element={<PublicPolicyPage type="ABOUT_US" canonical="/about" />} />
      <Route path="contact" element={<Contact />} />
      <Route path="faq" element={<Faq />} />
      <Route path="privacy-policy" element={<PublicPolicyPage type="PRIVACY_POLICY" canonical="/privacy-policy" />} />
      <Route path="terms-and-conditions" element={<PublicPolicyPage type="TERMS_CONDITIONS" canonical="/terms-and-conditions" />} />
      <Route path="shipping-policy" element={<PublicPolicyPage type="SHIPPING_POLICY" canonical="/shipping-policy" />} />
      <Route path="return-refund-policy" element={<PublicPolicyPage type="RETURN_REFUND_POLICY" canonical="/return-refund-policy" />} />
      <Route path="cancellation-policy" element={<PublicPolicyPage type="CANCELLATION_POLICY" canonical="/cancellation-policy" />} />
      <Route path="cod-policy" element={<PublicPolicyPage type="COD_POLICY" canonical="/cod-policy" />} />
      <Route path="custom-printing-policy" element={<PublicPolicyPage type="CUSTOM_PRINTING_POLICY" canonical="/custom-printing-policy" />} />
      <Route path="design-upload-guidelines" element={<PublicPolicyPage type="DESIGN_UPLOAD_GUIDELINES" canonical="/design-upload-guidelines" />} />
      <Route path="pages/:slug" element={<PublicCmsPage />} />
      <Route path="products/:slug" element={<ProductDetails />} />
      <Route path="track-order" element={<TrackOrderLookup />} />
      <Route path="register" element={<Register />} />
      <Route path="verify-otp" element={<VerifyOtp />} />
      <Route path="login" element={<Login />} />
      <Route path="admin-2fa" element={<AdminTwoFactor />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password/:token" element={<ResetPassword />} />
      <Route element={<ProtectedRoute />}>
        <Route path="account" element={<AccountDashboard />} />
        <Route path="account/profile" element={<ProfileEdit />} />
        <Route path="account/addresses" element={<AddressBook />} />
        <Route path="profile" element={<Profile />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-success/:id" element={<OrderSuccess />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="quotes" element={<MyQuotes />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="orders/:id/tracking" element={<TrackOrder />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="returns" element={<MyReturnRequests />} />
        <Route path="returns/new" element={<ReturnRequest />} />
        <Route path="returns/:id" element={<ReturnRequestDetails />} />
        <Route path="design-studio" element={<DesignStudio />} />
        <Route path="designs" element={<MyDesigns />} />
        <Route path="designs/saved" element={<SavedDesigns />} />
        <Route path="recently-viewed" element={<RecentlyViewed />} />
        <Route path="reviews" element={<MyReviews />} />
        <Route path="rewards" element={<MyRewards />} />
        <Route path="rewards/:type" element={<RewardUpload />} />
        <Route path="wishlist" element={<Wishlist />} />
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/announcements" element={<AdminAnnouncements />} />
        <Route path="admin/notifications" element={<AdminNotifications />} />
        <Route path="admin/analytics/sales" element={<SalesAnalytics />} />
        <Route path="admin/analytics/products" element={<ProductAnalytics />} />
        <Route path="admin/analytics/customers" element={<CustomerAnalytics />} />
        <Route path="admin/analytics/rewards" element={<RewardAnalytics />} />
        <Route path="admin/products" element={<AdminProducts />} />
        <Route path="admin/products/new" element={<AddProduct />} />
        <Route path="admin/products/:id/edit" element={<EditProduct />} />
        <Route path="admin/categories" element={<AdminCategories />} />
        <Route path="admin/coupons" element={<AdminCoupons />} />
        <Route path="admin/pages" element={<AdminCmsPages />} />
        <Route path="admin/pages/new" element={<AdminPageEditor />} />
        <Route path="admin/pages/:id/edit" element={<AdminPageEditor />} />
        <Route path="admin/policies" element={<AdminPolicies />} />
        <Route path="admin/faqs" element={<AdminFaqs />} />
        <Route path="admin/blog" element={<AdminBlog />} />
        <Route path="admin/blog/new" element={<AdminBlogEditor />} />
        <Route path="admin/blog/:id/edit" element={<AdminBlogEditor />} />
        <Route path="admin/lookbook" element={<AdminLookbook />} />
        <Route path="admin/lookbook/new" element={<AdminLookbookEditor />} />
        <Route path="admin/lookbook/:id/edit" element={<AdminLookbookEditor />} />
        <Route path="admin/designs" element={<AdminDesigns />} />
        <Route path="admin/offers" element={<AdminOffers />} />
        <Route path="admin/customers" element={<AdminCustomers />} />
        <Route path="admin/orders" element={<AdminOrders />} />
        <Route path="admin/orders/:id" element={<AdminOrderDetails />} />
        <Route path="admin/quotes" element={<AdminQuotes />} />
        <Route path="admin/shipping-zones" element={<AdminShippingZones />} />
        <Route path="admin/returns" element={<AdminReturns />} />
        <Route path="admin/returns/:id" element={<AdminReturnDetails />} />
        <Route path="admin/rewards" element={<AdminRewards />} />
        <Route path="admin/reviews" element={<AdminReviews />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>
    </Routes>
  </Suspense>
);

export default App;





