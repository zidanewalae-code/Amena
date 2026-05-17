const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define(
  'User',
  {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(20) }
  },
  { tableName: 'User', timestamps: false }
);

const Donator = sequelize.define(
  'Donator',
  {
    donor_id: { type: DataTypes.INTEGER, primaryKey: true },
    donor_level: { type: DataTypes.STRING(50) }
  },
  { tableName: 'Donator', timestamps: false }
);

const Organization = sequelize.define(
  'Organization',
  {
    organization_id: { type: DataTypes.INTEGER, primaryKey: true },
    organization_name: { type: DataTypes.STRING(100) },
    type: { type: DataTypes.STRING(50) }
  },
  { tableName: 'Organization', timestamps: false }
);

const DeliveryPerson = sequelize.define(
  'DeliveryPerson',
  {
    delivery_person_id: { type: DataTypes.INTEGER, primaryKey: true },
    vehicle_type: { type: DataTypes.STRING(50) },
    availability: { type: DataTypes.BOOLEAN, defaultValue: true }
  },
  { tableName: 'DeliveryPerson', timestamps: false }
);

const Admin = sequelize.define(
  'Admin',
  {
    admin_id: { type: DataTypes.INTEGER, primaryKey: true },
    role: { type: DataTypes.STRING(50) }
  },
  { tableName: 'Admin', timestamps: false }
);

const Category = sequelize.define(
  'Category',
  {
    category_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false }
  },
  { tableName: 'Category', timestamps: false }
);

const Product = sequelize.define(
  'Product',
  {
    product_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    expiration_date: { type: DataTypes.DATEONLY },
    category_id: { type: DataTypes.INTEGER, allowNull: true }
  },
  { tableName: 'Product', timestamps: false }
);

const Don = sequelize.define(
  'Don',
  {
    don_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.STRING(50) },
    donor_id: { type: DataTypes.INTEGER, allowNull: false }
  },
  { tableName: 'Don', timestamps: false }
);

const DonProduct = sequelize.define(
  'Don_Product',
  {
    don_id: { type: DataTypes.INTEGER, primaryKey: true },
    product_id: { type: DataTypes.INTEGER, primaryKey: true }
  },
  { tableName: 'Don_Product', timestamps: false }
);

const Purchase = sequelize.define(
  'Purchase',
  {
    purchase_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    total_price: { type: DataTypes.FLOAT },
    donor_id: { type: DataTypes.INTEGER, allowNull: false }
  },
  { tableName: 'Purchase', timestamps: false }
);

const Order = sequelize.define(
  'Orders',
  {
    order_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    status: { type: DataTypes.STRING(50) },
    delivery_address: { type: DataTypes.STRING(255) },
    order_date: { type: DataTypes.DATEONLY },
    purchase_id: { type: DataTypes.INTEGER, unique: true },
    delivery_person_id: { type: DataTypes.INTEGER }
  },
  { tableName: 'Orders', timestamps: false }
);

const Payment = sequelize.define(
  'Payment',
  {
    payment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    payment_method: { type: DataTypes.STRING(50) },
    payment_status: { type: DataTypes.STRING(50) },
    order_id: { type: DataTypes.INTEGER, unique: true }
  },
  { tableName: 'Payment', timestamps: false }
);

const Notification = sequelize.define(
  'Notification',
  {
    notification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    message: { type: DataTypes.TEXT },
    date: { type: DataTypes.DATEONLY },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    order_id: { type: DataTypes.INTEGER }
  },
  { tableName: 'Notification', timestamps: false }
);

const Alert = sequelize.define(
  'Alert',
  {
    alert_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(100) },
    description: { type: DataTypes.TEXT },
    priority: { type: DataTypes.STRING(50) },
    organization_id: { type: DataTypes.INTEGER, allowNull: false }
  },
  { tableName: 'Alert', timestamps: false }
);

const History = sequelize.define(
  'History',
  {
    history_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    action: { type: DataTypes.STRING(255) },
    action_date: { type: DataTypes.DATEONLY },
    order_id: { type: DataTypes.INTEGER, allowNull: true },
    don_id: { type: DataTypes.INTEGER, allowNull: true },
    delivery_person_id: { type: DataTypes.INTEGER, allowNull: true }
  },
  { tableName: 'History', timestamps: false }
);

User.hasOne(Donator, { foreignKey: 'donor_id', as: 'donator' });
User.hasOne(Organization, { foreignKey: 'organization_id', as: 'organizationProfile' });
User.hasOne(DeliveryPerson, { foreignKey: 'delivery_person_id', as: 'deliveryProfile' });
User.hasOne(Admin, { foreignKey: 'admin_id', as: 'adminProfile' });

Donator.belongsTo(User, { foreignKey: 'donor_id', as: 'user' });
Organization.belongsTo(User, { foreignKey: 'organization_id', as: 'user' });
DeliveryPerson.belongsTo(User, { foreignKey: 'delivery_person_id', as: 'user' });
Admin.belongsTo(User, { foreignKey: 'admin_id', as: 'user' });

Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

Don.belongsTo(Donator, { foreignKey: 'donor_id', as: 'donator' });
Donator.hasMany(Don, { foreignKey: 'donor_id', as: 'donations' });

Don.belongsToMany(Product, { through: DonProduct, foreignKey: 'don_id', otherKey: 'product_id', as: 'products' });
Product.belongsToMany(Don, { through: DonProduct, foreignKey: 'product_id', otherKey: 'don_id', as: 'donations' });

Purchase.belongsTo(Donator, { foreignKey: 'donor_id', as: 'donator' });
Donator.hasMany(Purchase, { foreignKey: 'donor_id', as: 'purchases' });

Order.belongsTo(Purchase, { foreignKey: 'purchase_id', as: 'purchase' });
Purchase.hasOne(Order, { foreignKey: 'purchase_id', as: 'order' });
Order.belongsTo(DeliveryPerson, { foreignKey: 'delivery_person_id', as: 'deliveryPerson' });
DeliveryPerson.hasMany(Order, { foreignKey: 'delivery_person_id', as: 'orders' });

Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });

Notification.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Order.hasMany(Notification, { foreignKey: 'order_id', as: 'notifications' });

Alert.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
Organization.hasMany(Alert, { foreignKey: 'organization_id', as: 'alerts' });

History.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
History.belongsTo(Don, { foreignKey: 'don_id', as: 'donation' });
History.belongsTo(DeliveryPerson, { foreignKey: 'delivery_person_id', as: 'deliveryPerson' });

module.exports = {
  sequelize,
  User,
  Donator,
  Organization,
  DeliveryPerson,
  Admin,
  Category,
  Product,
  Don,
  DonProduct,
  Purchase,
  Order,
  Payment,
  Notification,
  Alert,
  History
};