// Усі маршрути backend за ТЗ тімліда й Тьоми (префікс /api задається у VITE_API_URL).
type Id = number | string

export const ENDPOINTS = {
  auth: {
    register: '/auth/register/',
    token: '/auth/token/',
    refresh: '/auth/token/refresh/',
    logout: '/auth/logout/',
    me: '/auth/me/',
  },
  company: { root: '/companies/', me: '/companies/me/', finance: '/companies/me/finance/' },
  employees: {
    list: '/employees/',
    candidates: '/employees/candidates/',
    hire: '/employees/hire/',
    fire: (id: Id) => `/employees/${id}/fire/`,
  },
  contracts: {
    list: '/contracts/',
    detail: (id: Id) => `/contracts/${id}/`,
    accept: (id: Id) => `/contracts/${id}/accept/`,
    chat: (id: Id) => `/contracts/${id}/chat/`,
  },
  projects: {
    list: '/projects/',
    detail: (id: Id) => `/projects/${id}/`,
    assign: (id: Id) => `/projects/${id}/assign/`,
    unassign: (id: Id) => `/projects/${id}/unassign/`,
    submit: (id: Id) => `/projects/${id}/submit/`,
  },
  transactions: '/transactions/',
  events: {
    list: '/events/',
    history: '/events/history/',
    choose: (id: Id) => `/events/${id}/choose/`,
  },
  notifications: { list: '/notifications/', read: (id: Id) => `/notifications/${id}/read/` },
  leaderboard: '/leaderboard/',
} as const
