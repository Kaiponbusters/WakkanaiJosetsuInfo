// 稚内市除雪情報システム - プッシュ通知サービスワーカー

const CACHE_NAME = 'wakkanai-snow-notifications-v1'

// サービスワーカーのインストール
self.addEventListener('install', (event) => {
  console.log('サービスワーカーがインストールされました')
  self.skipWaiting()
})

// サービスワーカーのアクティベーション
self.addEventListener('activate', (event) => {
  console.log('サービスワーカーがアクティベートされました')
  event.waitUntil(self.clients.claim())
})

// プッシュ通知の受信
self.addEventListener('push', (event) => {
  console.log('プッシュ通知を受信しました:', event)
  
  let notificationData = {
    title: '稚内市除雪情報',
    body: '除雪作業に関する更新があります',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'snow-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: '詳細を見る'
      },
      {
        action: 'dismiss',
        title: '閉じる'
      }
    ]
  }

  // プッシュデータがある場合は解析
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        ...notificationData,
        ...data
      }
    } catch (error) {
      console.error('プッシュデータの解析に失敗しました:', error)
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      data: notificationData.data || {}
    })
  )
})

// 通知のクリック処理
self.addEventListener('notificationclick', (event) => {
  console.log('通知がクリックされました:', event)
  
  event.notification.close()

  if (event.action === 'view') {
    // 詳細表示アクション
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // 既存のウィンドウがあれば、それにフォーカス
        for (const client of clients) {
          if (client.url.includes('/notifications') && 'focus' in client) {
            return client.focus()
          }
        }
        
        // 新しいウィンドウを開く
        if (self.clients.openWindow) {
          return self.clients.openWindow('/notifications')
        }
      })
    )
  } else if (event.action === 'dismiss') {
    // 閉じるアクション - 何もしない
    return
  } else {
    // デフォルトのクリック処理
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // 既存のウィンドウがあれば、それにフォーカス
        for (const client of clients) {
          if ('focus' in client) {
            return client.focus()
          }
        }
        
        // 新しいウィンドウを開く
        if (self.clients.openWindow) {
          return self.clients.openWindow('/')
        }
      })
    )
  }
})

// 通知の閉じる処理
self.addEventListener('notificationclose', (event) => {
  console.log('通知が閉じられました:', event)
})