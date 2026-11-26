import type { EventKind, Specialization } from '../types'

export interface TaskPlan {
  title: string
  spec: Specialization
  work: number // людино-дні для Middle (продуктивність 1.0)
}

export interface ContractTemplate {
  title: string
  client: string
  description: string
  requirements: string
  budget: number
  difficulty: number
  days: number
  plan: TaskPlan[]
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    title: 'Лендінг для кавʼярні «Зерно»',
    client: 'Олег Гринчук',
    description: 'Односторінковий сайт з меню, адресою та формою бронювання столика.',
    requirements: 'Адаптивна верстка, форма бронювання, швидке завантаження.',
    budget: 30000, difficulty: 1, days: 8,
    plan: [
      { title: 'Дизайн макета', spec: 'designer', work: 6 },
      { title: 'Верстка сторінки', spec: 'frontend', work: 10 },
      { title: 'Тестування', spec: 'qa', work: 4 },
    ],
  },
  {
    title: 'Корпоративний сайт юридичної фірми',
    client: 'Марина Кравець',
    description: 'Сайт із розділами послуг, командою юристів, блогом і формою консультації.',
    requirements: 'CMS для новин, SEO-базис, форма зворотного звʼязку з надсиланням на email.',
    budget: 65000, difficulty: 2, days: 14,
    plan: [
      { title: 'Дизайн сайту', spec: 'designer', work: 10 },
      { title: 'Frontend', spec: 'frontend', work: 16 },
      { title: 'Backend і CMS', spec: 'backend', work: 12 },
      { title: 'QA', spec: 'qa', work: 6 },
    ],
  },
  {
    title: 'Інтернет-магазин спортивного одягу',
    client: 'Андрій Лисенко',
    description: 'Каталог із фільтрами, кошик, оформлення замовлення та онлайн-оплата.',
    requirements: 'Інтеграція платіжного шлюзу, адмін-панель товарів, адаптивний інтерфейс.',
    budget: 120000, difficulty: 3, days: 20,
    plan: [
      { title: 'Дизайн магазину', spec: 'designer', work: 12 },
      { title: 'Каталог і кошик', spec: 'frontend', work: 20 },
      { title: 'API замовлень', spec: 'backend', work: 18 },
      { title: 'Інтеграція платежів', spec: 'fullstack', work: 12 },
      { title: 'QA', spec: 'qa', work: 8 },
    ],
  },
  {
    title: 'REST API для складського обліку',
    client: 'Віктор Мороз',
    description: 'API для обліку товарів, надходжень і списань зі складу.',
    requirements: 'Документація OpenAPI, авторизація JWT, покриття тестами ключових сценаріїв.',
    budget: 80000, difficulty: 2, days: 14,
    plan: [
      { title: 'Проєктування API', spec: 'backend', work: 8 },
      { title: 'Реалізація ендпоінтів', spec: 'backend', work: 18 },
      { title: 'Документація і тести', spec: 'qa', work: 6 },
    ],
  },
  {
    title: 'CRM для автосервісу',
    client: 'Ігор Сидоренко',
    description: 'Вебзастосунок для запису клієнтів, замовлень на ремонт і складу запчастин.',
    requirements: 'Ролі майстра й адміністратора, звіти по виручці, експорт у CSV.',
    budget: 150000, difficulty: 4, days: 24,
    plan: [
      { title: 'Інтерфейс', spec: 'frontend', work: 18 },
      { title: 'Серверна частина', spec: 'backend', work: 20 },
      { title: 'Інтеграції та звіти', spec: 'fullstack', work: 12 },
      { title: 'Тестування', spec: 'qa', work: 10 },
    ],
  },
  {
    title: 'Автоматизація звітності для бухгалтерії',
    client: 'Тетяна Романюк',
    description: 'Скрипти, що збирають дані з таблиць і формують щомісячні звіти.',
    requirements: 'Запуск за розкладом, логування помилок, простий вебінтерфейс перегляду.',
    budget: 45000, difficulty: 1, days: 10,
    plan: [
      { title: 'Скрипти обробки даних', spec: 'backend', work: 10 },
      { title: 'Вебінтерфейс', spec: 'frontend', work: 6 },
      { title: 'QA', spec: 'qa', work: 3 },
    ],
  },
  {
    title: 'Мобільний застосунок для фітнес-клубу',
    client: 'Наталія Бойко',
    description: 'Застосунок із розкладом занять, записом на тренування та абонементами.',
    requirements: 'Push-сповіщення, оплата абонементів, синхронізація з сайтом клубу.',
    budget: 170000, difficulty: 5, days: 28,
    plan: [
      { title: 'Дизайн застосунку', spec: 'designer', work: 14 },
      { title: 'Клієнтська частина', spec: 'frontend', work: 24 },
      { title: 'API', spec: 'backend', work: 18 },
      { title: 'QA', spec: 'qa', work: 10 },
    ],
  },
]

export interface EventEffectDef {
  balance?: number // у гривнях
  reputation?: number
  urgentContract?: boolean
}
export interface EventChoiceDef {
  text: string
  outcome: string
  effect: EventEffectDef
}
export interface EventTemplateDef {
  key: string
  title: string
  description: string
  kind: EventKind
  needsEmployees?: boolean
  choices: EventChoiceDef[]
}

export const EVENT_TEMPLATES: EventTemplateDef[] = [
  {
    key: 'review', kind: 'positive', title: 'Хороший відгук',
    description: 'Клієнт залишив теплий відгук про вашу компанію на профільному форумі.',
    choices: [
      { text: 'Опублікувати на сайті', outcome: 'Відгук підвищив довіру до компанії.', effect: { reputation: 3 } },
      { text: 'Подякувати клієнту подарунком', outcome: 'Клієнт вдячний і рекомендує вас знайомим.', effect: { reputation: 2, balance: -2000 } },
    ],
  },
  {
    key: 'partner', kind: 'positive', title: 'Пропозиція партнерства',
    description: 'Студія-партнер пропонує спільно виконувати замовлення та ділитися клієнтами.',
    choices: [
      { text: 'Прийняти пропозицію', outcome: 'Партнерство принесло перші гроші та впізнаваність.', effect: { balance: 10000, reputation: 2 } },
      { text: 'Відхилити', outcome: 'Ви залишились незалежними.', effect: {} },
    ],
  },
  {
    key: 'sick', kind: 'negative', needsEmployees: true, title: 'Хвороба працівника',
    description: 'Один із працівників захворів і просить допомоги з лікуванням.',
    choices: [
      { text: 'Оплатити лікування', outcome: 'Працівник вдячний, команда цінує турботу.', effect: { balance: -3000, reputation: 1 } },
      { text: 'Нехай одужує самостійно', outcome: 'У команді виникло невдоволення.', effect: { reputation: -1 } },
    ],
  },
  {
    key: 'outage', kind: 'negative', title: 'Збій сервера',
    description: 'Хостинг-провайдер зазнав збою, сайти клієнтів недоступні.',
    choices: [
      { text: 'Терміново перенести на інший хостинг', outcome: 'Проблему усунули за кілька годин.', effect: { balance: -8000 } },
      { text: 'Чекати відновлення', outcome: 'Клієнти незадоволені простоєм.', effect: { reputation: -3 } },
    ],
  },
  {
    key: 'scope', kind: 'negative', title: 'Зміна технічного завдання',
    description: 'Клієнт несподівано змінив вимоги до проєкту.',
    choices: [
      { text: 'Погодити зміни за додаткову плату', outcome: 'Клієнт погодився доплатити за зміни.', effect: { balance: 5000, reputation: 1 } },
      { text: 'Відмовити', outcome: 'Клієнт обурений відмовою.', effect: { reputation: -2 } },
    ],
  },
  {
    key: 'raise', kind: 'neutral', needsEmployees: true, title: 'Працівник просить підвищення',
    description: 'Досвідчений працівник просить підвищити зарплату або виплатити премію.',
    choices: [
      { text: 'Підвищити зарплату', outcome: 'Працівник залишився задоволеним.', effect: { reputation: 2 } },
      { text: 'Виплатити премію', outcome: 'Разова премія покращила настрій команди.', effect: { balance: -4000 } },
      { text: 'Відмовити', outcome: 'Працівник розчарований.', effect: { reputation: -2 } },
    ],
  },
  {
    key: 'urgent', kind: 'neutral', title: 'Термінове замовлення',
    description: 'Постійний клієнт просить терміново виконати вигідне замовлення.',
    choices: [
      { text: 'Взяти замовлення', outcome: 'Термінове замовлення додано на біржу контрактів.', effect: { urgentContract: true } },
      { text: 'Відмовитись', outcome: 'Ви не взяли додаткового навантаження.', effect: {} },
    ],
  },
  {
    key: 'crisis', kind: 'negative', title: 'Ринкова криза',
    description: 'Ринок просів, клієнти скорочують бюджети на розробку.',
    choices: [
      { text: 'Запустити акцію для клієнтів', outcome: 'Акція втримала клієнтів, але вдарила по бюджету.', effect: { balance: -6000, reputation: 1 } },
      { text: 'Скоротити маркетинг', outcome: 'Заощаджено кошти, але видимість компанії впала.', effect: { balance: 3000, reputation: -2 } },
    ],
  },
]
