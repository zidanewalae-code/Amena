export const roles = ['admin', 'donator', 'organization', 'delivery_person'];

export const roleLabels = {
  admin: 'Admin',
  donator: 'Donator',
  organization: 'Organization',
  delivery_person: 'Delivery Person'
};

export const dashboardPaths = {
  admin: '/dashboard/admin',
  donator: '/dashboard/donator',
  organization: '/dashboard/organization',
  delivery_person: '/dashboard/delivery-person'
};

const sectionCatalog = {
  users: {
    key: 'users',
    label: 'Users',
    endpoint: '/users',
    hint: 'Registered accounts',
    description: 'Latest users for system supervision.',
    summary: (item) => `${item.role || '-'} | ${item.email || '-'}`,
    getItemTitle: (item) => item.name || item.email || 'User'
  },
  products: {
    key: 'products',
    label: 'Products',
    endpoint: '/products',
    hint: 'Inventory items',
    description: 'Current catalog items managed through CRUD.',
    summary: (item) => `${item.quantity || 0} items | ${item.category?.name || '-'}`,
    getItemTitle: (item) => `Product #${item.product_id || '-'}`,
    action: { to: '/products', label: 'Open products' }
  },
  dons: {
    key: 'dons',
    label: 'Dons',
    endpoint: '/dons',
    hint: 'Donation records',
    description: 'Recent donations from the API.',
    summary: (item) => `${item.date || '-'} | ${item.status || 'pending'}`,
    getItemTitle: (item) => `Don #${item.don_id || '-'}`,
    action: { to: '/donations', label: 'Open donations' }
  },
  orders: {
    key: 'orders',
    label: 'Orders',
    endpoint: '/orders',
    hint: 'Delivery orders',
    description: 'Recent delivery orders and status updates.',
    summary: (item) => `${item.status || '-'} | ${item.delivery_address || '-'}`,
    getItemTitle: (item) => `Order #${item.order_id || '-'}`,
    action: { to: '/orders', label: 'Open orders' }
  },
  payments: {
    key: 'payments',
    label: 'Payments',
    endpoint: '/payments',
    hint: 'Payment records',
    description: 'Payment transactions linked to orders.',
    summary: (item) => `${item.amount || 0} | ${item.payment_status || '-'}`,
    getItemTitle: (item) => `Payment #${item.payment_id || '-'}`,
    action: { to: '/payments', label: 'Open payments' }
  },
  notifications: {
    key: 'notifications',
    label: 'Notifications',
    endpoint: '/notifications',
    hint: 'User messages',
    description: 'Latest notifications from operational flows.',
    summary: (item) => `${item.message || '-'} | ${item.is_read ? 'read' : 'unread'}`,
    getItemTitle: (item) => item.message || 'Notification',
    action: { to: '/notifications', label: 'Open notifications' }
  },
  alerts: {
    key: 'alerts',
    label: 'Alerts',
    endpoint: '/alerts',
    hint: 'Organization alerts',
    description: 'Priority alerts that require operational attention.',
    summary: (item) => `${item.title || '-'} | ${item.priority || '-'}`,
    getItemTitle: (item) => item.title || 'Alert',
    action: { to: '/alerts', label: 'Open alerts' }
  },
  history: {
    key: 'history',
    label: 'History',
    endpoint: '/history',
    hint: 'Activity trail',
    description: 'Recent activity entries for tracking operations.',
    summary: (item) => `${item.action || '-'} | ${item.action_date || '-'}`,
    getItemTitle: (item) => item.action || 'History entry',
    action: { to: '/history', label: 'Open history' }
  }
};

const dashboardRoleConfig = {
  admin: {
    title: 'Admin Dashboard',
    subtitle: 'Global operational overview for administrators.',
    stats: ['users', 'dons', 'orders', 'products', 'payments', 'alerts'],
    sections: ['users', 'orders', 'payments', 'alerts'],
    quickLinks: [
      { to: '/orders', label: 'Manage orders' },
      { to: '/alerts', label: 'Manage alerts' }
    ],
    sidebarLinks: [
      { to: '/orders', label: 'Orders' },
      { to: '/payments', label: 'Payments' },
      { to: '/alerts', label: 'Alerts' },
      { to: '/profile', label: 'Profile' }
    ],
    allowedPages: ['orders', 'alerts', 'payments', 'profile']
  },
  donator: {
  title: 'Donator Dashboard',
  subtitle: 'Track your donations, related orders, and activity.',
  stats: ['dons', 'orders', 'history'],
  sections: ['dons', 'orders', 'history'],

  quickLinks: [
    { to: '/donations', label: 'Open donations' },
    { to: '/alerts', label: 'View needs' },
    { to: '/orders', label: 'Open orders' },
    { to: '/profile', label: 'Edit profile' }
  ],

  sidebarLinks: [
    { to: '/donations', label: 'Donations' },
    { to: '/alerts', label: 'Needs' },
    { to: '/orders', label: 'Orders' },
    { to: '/history', label: 'History' },
    { to: '/profile', label: 'Profile' }
  ],

  allowedPages: [
    'donations',
    'alerts',
    'orders',
    'history',
    'profile'
  ]
},
  organization: {
    title: 'Organization Dashboard',
    subtitle: 'Coordinate products, incoming donations, alerts, and operations.',
    stats: ['products', 'dons', 'orders', 'alerts'],
    sections: ['products', 'dons', 'orders', 'alerts'],
    quickLinks: [
      { to: '/products', label: 'Manage products' },
      { to: '/donations', label: 'Manage donations' },
      { to: '/orders', label: 'Manage orders' },
      { to: '/alerts', label: 'Manage alerts' }
    ],
    sidebarLinks: [
      { to: '/products', label: 'Products' },
      { to: '/donations', label: 'Donations' },
      { to: '/orders', label: 'Orders' },
      { to: '/alerts', label: 'Alerts' },
      { to: '/profile', label: 'Profile' }
    ],
    allowedPages: ['products', 'donations', 'orders', 'alerts', 'profile']
  },
  delivery_person: {
    title: 'Delivery Person Dashboard',
    subtitle: 'Focus on assigned orders and delivery status.',
    stats: ['orders', 'history'],
    sections: ['orders', 'history'],
    quickLinks: [
      { to: '/orders', label: 'Open orders' },
      { to: '/history', label: 'Open history' },
      { to: '/profile', label: 'Edit profile' }
    ],
    sidebarLinks: [
      { to: '/orders', label: 'Orders' },
      { to: '/history', label: 'History' },
      { to: '/profile', label: 'Profile' }
    ],
    allowedPages: ['orders', 'history', 'profile']
  }
};

export const dashboardConfigs = dashboardRoleConfig;

export function getDashboardPath(role) {
  return dashboardPaths[role] || '/';
}

export function getDashboardConfig(role) {
  return dashboardRoleConfig[role] || dashboardRoleConfig.donator;
}

export function getPageAccess(pageKey) {
  return roles.filter((role) => (dashboardRoleConfig[role]?.allowedPages || []).includes(pageKey));
}

export function canAccessRoute(userRole, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return allowedRoles.includes(userRole);
}

export function getVisibleSidebarLinks(user) {
  if (!user) {
    return {
      publicLinks: [
        { to: '/', label: 'Home' },
        { to: '/login', label: 'Login' },
        { to: '/register', label: 'Register' }
      ],
      dashboardLinks: []
    };
  }

  const config = getDashboardConfig(user.role);

  return {
    publicLinks: [{ to: '/', label: 'Home' }],
    dashboardLinks: [
      { to: getDashboardPath(user.role), label: config.title || 'Dashboard' },
      ...(config.sidebarLinks || [])
    ]
  };
}

export function getDashboardSections(role) {
  return getDashboardConfig(role).sections.map((sectionKey) => sectionCatalog[sectionKey]).filter(Boolean);
}

export function getDashboardStats(role) {
  return getDashboardConfig(role).stats.map((sectionKey) => sectionCatalog[sectionKey]).filter(Boolean);
}

export function getSectionHint(sectionKey) {
  return sectionCatalog[sectionKey]?.hint || 'Dashboard metric';
}

export function getSectionDescription(sectionKey) {
  return sectionCatalog[sectionKey]?.description || 'Latest records from the backend API.';
}

export function getSectionItemTitle(sectionKey, item) {
  const resolver = sectionCatalog[sectionKey]?.getItemTitle;

  if (resolver) {
    return resolver(item);
  }

  return item?.title || item?.name || 'Record';
}