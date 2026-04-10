// Initializes model associations and exports all Sequelize models.
const User = require('./User');
const Organization = require('./Organization');
const Beneficiary = require('./Beneficiary');
const Profile = require('./Profile');
const Need = require('./Need');
const NeedUpdate = require('./NeedUpdate');
const DonationCart = require('./DonationCart');
const DonationCartItem = require('./DonationCartItem');
const DonationOrder = require('./DonationOrder');
const Donation = require('./Donation');
const PaymentTransaction = require('./PaymentTransaction');
const PaymentAuditLog = require('./PaymentAuditLog');
const Notification = require('./Notification');
const PaymentWebhookEvent = require('./PaymentWebhookEvent');
const CourierProfile = require('./CourierProfile');
const DeliveryMission = require('./DeliveryMission');
const DeliveryEvent = require('./DeliveryEvent');
const DeliveryProof = require('./DeliveryProof');
const DeliveryRequest = require('./DeliveryRequest');
const DeliveryOffer = require('./DeliveryOffer');
const SocialProduct = require('./SocialProduct');
const SocialDonation = require('./SocialDonation');
const SocialOrder = require('./SocialOrder');
const SocialOrderItem = require('./SocialOrderItem');
const SocialBeneficiary = require('./SocialBeneficiary');
const SocialAssignment = require('./SocialAssignment');
const MarketplaceItem = require('./MarketplaceItem');
const MarketplaceOrder = require('./MarketplaceOrder');
const MarketplaceOrderItem = require('./MarketplaceOrderItem');
const MarketplaceReport = require('./MarketplaceReport');

User.hasOne(Organization, { foreignKey: 'user_id', as: 'organization' });
Organization.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Beneficiary, { foreignKey: 'user_id', as: 'beneficiary' });
Beneficiary.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Profile, { foreignKey: 'user_id', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Organization.hasMany(Need, { foreignKey: 'organization_id', as: 'needs' });
Need.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Beneficiary.hasMany(Need, { foreignKey: 'beneficiary_id', as: 'needs' });
Need.belongsTo(Beneficiary, { foreignKey: 'beneficiary_id', as: 'beneficiary' });

User.hasMany(Need, { foreignKey: 'created_by_user_id', as: 'createdNeeds' });
Need.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'creator' });

Need.hasMany(NeedUpdate, { foreignKey: 'need_id', as: 'updates' });
NeedUpdate.belongsTo(Need, { foreignKey: 'need_id', as: 'need' });

User.hasMany(NeedUpdate, { foreignKey: 'created_by_user_id', as: 'needUpdates' });
NeedUpdate.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'author' });

User.hasOne(DonationCart, { foreignKey: 'donor_user_id', as: 'donationCart' });
DonationCart.belongsTo(User, { foreignKey: 'donor_user_id', as: 'donor' });

DonationCart.hasMany(DonationCartItem, { foreignKey: 'cart_id', as: 'items' });
DonationCartItem.belongsTo(DonationCart, { foreignKey: 'cart_id', as: 'cart' });

Need.hasMany(DonationCartItem, { foreignKey: 'need_id', as: 'cartItems' });
DonationCartItem.belongsTo(Need, { foreignKey: 'need_id', as: 'need' });

User.hasMany(DonationOrder, { foreignKey: 'donor_user_id', as: 'donationOrders' });
DonationOrder.belongsTo(User, { foreignKey: 'donor_user_id', as: 'donor' });

DonationCart.hasMany(DonationOrder, { foreignKey: 'cart_id', as: 'orders' });
DonationOrder.belongsTo(DonationCart, { foreignKey: 'cart_id', as: 'cart' });

DonationOrder.hasMany(Donation, { foreignKey: 'order_id', as: 'donations' });
Donation.belongsTo(DonationOrder, { foreignKey: 'order_id', as: 'order' });

User.hasMany(Donation, { foreignKey: 'donor_user_id', as: 'donations' });
Donation.belongsTo(User, { foreignKey: 'donor_user_id', as: 'donor' });

Need.hasMany(Donation, { foreignKey: 'need_id', as: 'donations' });
Donation.belongsTo(Need, { foreignKey: 'need_id', as: 'need' });

DonationOrder.hasOne(PaymentTransaction, { foreignKey: 'donation_order_id', as: 'transaction' });
PaymentTransaction.belongsTo(DonationOrder, { foreignKey: 'donation_order_id', as: 'order' });

PaymentTransaction.hasMany(PaymentAuditLog, { foreignKey: 'payment_transaction_id', as: 'auditLogs' });
PaymentAuditLog.belongsTo(PaymentTransaction, { foreignKey: 'payment_transaction_id', as: 'paymentTransaction' });

DonationOrder.hasMany(PaymentAuditLog, { foreignKey: 'donation_order_id', as: 'paymentAuditLogs' });
PaymentAuditLog.belongsTo(DonationOrder, { foreignKey: 'donation_order_id', as: 'order' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(CourierProfile, { foreignKey: 'user_id', as: 'courierProfile' });
CourierProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Need.hasMany(DeliveryMission, { foreignKey: 'need_id', as: 'deliveryMissions' });
DeliveryMission.belongsTo(Need, { foreignKey: 'need_id', as: 'need' });

DonationOrder.hasMany(DeliveryMission, { foreignKey: 'donation_order_id', as: 'deliveryMissions' });
DeliveryMission.belongsTo(DonationOrder, { foreignKey: 'donation_order_id', as: 'order' });

User.hasMany(DeliveryMission, { foreignKey: 'courier_user_id', as: 'assignedMissions' });
DeliveryMission.belongsTo(User, { foreignKey: 'courier_user_id', as: 'courier' });

User.hasMany(DeliveryMission, { foreignKey: 'created_by_user_id', as: 'createdMissions' });
DeliveryMission.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'missionCreator' });

DeliveryMission.hasMany(DeliveryEvent, { foreignKey: 'mission_id', as: 'events' });
DeliveryEvent.belongsTo(DeliveryMission, { foreignKey: 'mission_id', as: 'mission' });

DeliveryMission.hasMany(DeliveryProof, { foreignKey: 'mission_id', as: 'proofs' });
DeliveryProof.belongsTo(DeliveryMission, { foreignKey: 'mission_id', as: 'mission' });

User.hasMany(DeliveryEvent, { foreignKey: 'actor_user_id', as: 'deliveryActions' });
DeliveryEvent.belongsTo(User, { foreignKey: 'actor_user_id', as: 'actor' });

User.hasMany(DeliveryRequest, { foreignKey: 'requested_by_user_id', as: 'deliveryRequests' });
DeliveryRequest.belongsTo(User, { foreignKey: 'requested_by_user_id', as: 'requester' });

User.hasMany(DeliveryRequest, { foreignKey: 'assigned_courier_id', as: 'acceptedDeliveryRequests' });
DeliveryRequest.belongsTo(User, { foreignKey: 'assigned_courier_id', as: 'assignedCourier' });

Need.hasMany(DeliveryRequest, { foreignKey: 'need_id', as: 'deliveryRequests' });
DeliveryRequest.belongsTo(Need, { foreignKey: 'need_id', as: 'need' });

DonationOrder.hasMany(DeliveryRequest, { foreignKey: 'donation_order_id', as: 'deliveryRequests' });
DeliveryRequest.belongsTo(DonationOrder, { foreignKey: 'donation_order_id', as: 'donationOrder' });

DeliveryRequest.hasMany(DeliveryOffer, { foreignKey: 'request_id', as: 'offers' });
DeliveryOffer.belongsTo(DeliveryRequest, { foreignKey: 'request_id', as: 'request' });

User.hasMany(DeliveryOffer, { foreignKey: 'courier_user_id', as: 'deliveryOffers' });
DeliveryOffer.belongsTo(User, { foreignKey: 'courier_user_id', as: 'courier' });

// Socio-solidarity module associations
User.hasMany(SocialDonation, { foreignKey: 'user_id', as: 'socialDonations' });
SocialDonation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(SocialOrder, { foreignKey: 'user_id', as: 'socialOrders' });
SocialOrder.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

SocialOrder.hasMany(SocialOrderItem, { foreignKey: 'order_id', as: 'items' });
SocialOrderItem.belongsTo(SocialOrder, { foreignKey: 'order_id', as: 'order' });

SocialProduct.hasMany(SocialOrderItem, { foreignKey: 'product_id', as: 'orderItems' });
SocialOrderItem.belongsTo(SocialProduct, { foreignKey: 'product_id', as: 'product' });

SocialBeneficiary.hasMany(SocialAssignment, { foreignKey: 'beneficiary_id', as: 'assignments' });
SocialAssignment.belongsTo(SocialBeneficiary, { foreignKey: 'beneficiary_id', as: 'beneficiary' });

SocialDonation.hasMany(SocialAssignment, { foreignKey: 'donation_id', as: 'assignments' });
SocialAssignment.belongsTo(SocialDonation, { foreignKey: 'donation_id', as: 'donation' });

SocialOrder.hasMany(SocialAssignment, { foreignKey: 'order_id', as: 'assignments' });
SocialAssignment.belongsTo(SocialOrder, { foreignKey: 'order_id', as: 'order' });

// Marketplace module associations
User.hasMany(MarketplaceItem, { foreignKey: 'seller_user_id', as: 'marketplaceItems' });
MarketplaceItem.belongsTo(User, { foreignKey: 'seller_user_id', as: 'seller' });

User.hasMany(MarketplaceOrder, { foreignKey: 'buyer_user_id', as: 'marketplaceOrders' });
MarketplaceOrder.belongsTo(User, { foreignKey: 'buyer_user_id', as: 'buyer' });

MarketplaceOrder.hasMany(MarketplaceOrderItem, { foreignKey: 'order_id', as: 'items' });
MarketplaceOrderItem.belongsTo(MarketplaceOrder, { foreignKey: 'order_id', as: 'order' });

MarketplaceItem.hasMany(MarketplaceOrderItem, { foreignKey: 'item_id', as: 'orderItems' });
MarketplaceOrderItem.belongsTo(MarketplaceItem, { foreignKey: 'item_id', as: 'item' });

MarketplaceItem.hasMany(MarketplaceReport, { foreignKey: 'item_id', as: 'reports' });
MarketplaceReport.belongsTo(MarketplaceItem, { foreignKey: 'item_id', as: 'item' });

User.hasMany(MarketplaceReport, { foreignKey: 'reporter_user_id', as: 'marketplaceReports' });
MarketplaceReport.belongsTo(User, { foreignKey: 'reporter_user_id', as: 'reporter' });

module.exports = {
  User,
  Organization,
  Beneficiary,
  Profile,
  Need,
  NeedUpdate,
  DonationCart,
  DonationCartItem,
  DonationOrder,
  Donation,
  PaymentTransaction,
  PaymentAuditLog,
  Notification,
  PaymentWebhookEvent,
  CourierProfile,
  DeliveryMission,
  DeliveryEvent,
  DeliveryProof,
  DeliveryRequest,
  DeliveryOffer,
  SocialProduct,
  SocialDonation,
  SocialOrder,
  SocialOrderItem,
  SocialBeneficiary,
  SocialAssignment,
  MarketplaceItem,
  MarketplaceOrder,
  MarketplaceOrderItem,
  MarketplaceReport
};
