"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, CheckCircle, Loader2, AlertCircle, XCircle } from "lucide-react"
import addNotification from 'react-push-notification'

const ONE_SIGNAL_APP_ID = "a405e5ea-deec-490e-bdc3-38b65b4ec31c"
const CONFIG_URL = "https://cdn.jsdelivr.net/gh/nadermkhan/cfgl@latest/config.json"

const categories = [
  {
    id: "weekly_report",
    name: "Weekly Report",
    description: "Latest news in technology and innovation.",
    txt: "Ihr Wochenrückblick aus dem Rathaus! Jeden Freitag erhalten Sie unseren Wochenbericht kompakt zusammengefasst, was die Verwaltung diese Woche im Ort bewegt hat. Von wichtigen Entscheidungen über Projekte, Veranstaltungen oder interessante Fakten über die Gemeinde. Bleiben Sie mühelos auf dem Laufenden über alles, was in Laaber passiert ist.",
  },
  {
    id: "townhall_news",
    name: "Town Hall News",
    description: "Announcements for our new products.",
    txt: "Hier erhalten Sie alle allgemeinen Informationen aus der Verwaltung. Wir informieren Sie über Schließtage, geänderte Öffnungszeiten, bevorstehende Gemeinderatssitzungen, wichtige Ergebnisse aus dem Haushaltsbericht, geplante Bauvorhaben der Gemeinde oder ein neues Mitteilungsblatt.",
  },
  {
    id: "emergencies",
    name: "Emergencies",
    description: "Exclusive discounts and promotions.",
    txt: "Dieser Kanal ist für wichtige Informationen im Notfall oder bei Katastrophen. Ob Unwetterwarnungen, Hochwasser oder andere akute Gefahren im Ortsbereich wir informieren Sie umgehend.",
  },
  {
    id: "closures_and_disruptions",
    name: "Closures and disruptions",
    description: "Updates and news from our team.",
    txt: "Hier gibt es aktuelle Meldungen zur öffentlichen Versorgung und zum Verkehr. Das bedeutet: Sofortige Infos zu Straßensperrungen, wichtigen Baustellen und anderen relevanten Beeinträchtigungen",
  },
  {
    id: "events",
    name: "Events",
    description: "A roundup of the weeks best content.",
    txt: "Was ist diese Woche los in Laaber? Jeden Montag liefern wir Ihnen die Veranstaltungen für die kommende Woche! Erfahren Sie auf einen Blick, welche öffentlichen Feste, Märkte, Konzerte oder Sportevents anstehen",
  },
]

export default function NotificationApp() {
  const [appConfig, setAppConfig] = useState(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [configError, setConfigError] = useState(null)
  const [lastConfigCheck, setLastConfigCheck] = useState(null)
  const [oneSignalState, setOneSignalState] = useState({
    isLoading: true,
    isInitialized: false,
    isSubscribed: false,
    permission: "default",
    userId: null,
    error: null,
  })
  const [selectedCategory, setSelectedCategory] = useState(null)
  const initializationRef = useRef(false)

  // Fetch remote config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfigLoading(true)
        
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const urlWithParams = `${CONFIG_URL}?t=${timestamp}&r=${random}`
        
        const response = await fetch(urlWithParams, {
          method: 'GET',
          cache: 'no-cache',
          mode: 'cors',
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.status}`)
        }
        
        const data = await response.json()
        
        setAppConfig(data)
        setConfigError(null)
        setLastConfigCheck(new Date())
        
        console.log('Config fetched:', new Date().toISOString(), data)
      } catch (error) {
        console.error("Error fetching config:", error)
        setConfigError("Failed to load app configuration")
        setAppConfig({ appEnabled: true })
      } finally {
        setConfigLoading(false)
      }
    }

    fetchConfig()
    const interval = setInterval(fetchConfig, 30000)
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchConfig()
      }
    }
    
    const handleFocus = () => {
      fetchConfig()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Load saved category from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("selectedNotificationCategory")
    if (saved) {
      setSelectedCategory(saved)
    }
  }, [])

  // Initialize OneSignal
  useEffect(() => {
    if (!appConfig?.appEnabled || configLoading) {
      return
    }

    const initializeOneSignal = async () => {
      if (initializationRef.current || window.OneSignalInitialized) {
        // If already initialized, just update the state
        if (window.OneSignal && window.OneSignal.initialized) {
          try {
            const isPushSupported = window.OneSignal.Notifications.isPushSupported()
            if (isPushSupported) {
              const permission = await window.OneSignal.Notifications.permission
              const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn
              const subscriptionId = await window.OneSignal.User.PushSubscription.id
              
              // Get user ID using the correct method
              const onesignalId = await window.OneSignal.User.onesignalId

              console.log('OneSignal State:', {
                permission,
                isOptedIn,
                subscriptionId,
                onesignalId
              })

              setOneSignalState({
                isLoading: false,
                isInitialized: true,
                isSubscribed: isOptedIn,
                permission,
                userId: onesignalId || subscriptionId,
                error: null,
              })

              if (isOptedIn && onesignalId) {
                const savedCategory = localStorage.getItem("selectedNotificationCategory")
                if (savedCategory) {
                  await window.OneSignal.User.addTags({
                    category: savedCategory,
                    subscribed_at: new Date().toISOString()
                  })
                }
              }
            }
          } catch (error) {
            console.error("Error checking OneSignal state:", error)
          }
        }
        return
      }
      initializationRef.current = true

      try {
        if (typeof window === "undefined") {
          return
        }

        // Load OneSignal SDK
        await new Promise((resolve, reject) => {
          if (window.OneSignal) {
            resolve()
            return
          }

          window.OneSignalDeferred = window.OneSignalDeferred || []

          const script = document.createElement("script")
          script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          script.async = true
          script.defer = true

          script.onload = () => {
            window.OneSignalDeferred.push(() => {
              resolve()
            })
          }

          script.onerror = () => {
            reject(new Error("Failed to load OneSignal SDK"))
          }

          document.head.appendChild(script)
        })

        const OneSignalInstance = await new Promise((resolve) => {
          if (window.OneSignal) {
            resolve(window.OneSignal)
          } else {
            window.OneSignalDeferred.push((OneSignal) => {
              resolve(OneSignal)
            })
          }
        })

        // Initialize OneSignal
        await OneSignalInstance.init({
          appId: ONE_SIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false
          },
          serviceWorkerParam: {
            scope: "/",
            workerName: "OneSignalSDKWorker.js",
            updaterWorkerName: "OneSignalSDKUpdaterWorker.js",
            registrationOptions: {
              scope: "/"
            }
          },
          persistNotification: true,
          webhooks: {
            cors: true,
          },
          autoResubscribe: true,
        })

        window.OneSignalInitialized = true

        // Wait for initialization to complete
        await new Promise(resolve => setTimeout(resolve, 1000))

        const isPushSupported = OneSignalInstance.Notifications.isPushSupported()

        if (isPushSupported) {
          const permission = await OneSignalInstance.Notifications.permission
          const isOptedIn = await OneSignalInstance.User.PushSubscription.optedIn
          const subscriptionId = await OneSignalInstance.User.PushSubscription.id
          
          // Get user ID - this is the correct way
          const onesignalId = await OneSignalInstance.User.onesignalId

          console.log('OneSignal initialized with:', {
            permission,
            isOptedIn,
            subscriptionId,
            onesignalId
          })

          setOneSignalState({
            isLoading: false,
            isInitialized: true,
            isSubscribed: isOptedIn,
            permission,
            userId: onesignalId || subscriptionId,
            error: null,
          })

          if (isOptedIn && onesignalId) {
            const savedCategory = localStorage.getItem("selectedNotificationCategory")
            if (savedCategory) {
              await OneSignalInstance.User.addTags({
                category: savedCategory,
                subscribed_at: new Date().toISOString()
              })
              
              localStorage.setItem("notificationSubscription", JSON.stringify({
                userId: onesignalId,
                category: savedCategory,
                subscribedAt: new Date().toISOString()
              }))
            }
          }

          // Event listeners
          OneSignalInstance.User.PushSubscription.addEventListener("change", async (event) => {
            const isNowOptedIn = event.current.optedIn
            const newOnesignalId = await OneSignalInstance.User.onesignalId

            console.log('Subscription changed', { 
              isNowOptedIn,
              newOnesignalId
            })

            setOneSignalState((prev) => ({
              ...prev,
              isSubscribed: isNowOptedIn,
              userId: newOnesignalId,
            }))

            if (isNowOptedIn && newOnesignalId) {
              const savedCategory = localStorage.getItem("selectedNotificationCategory")
              if (savedCategory) {
                await OneSignalInstance.User.addTags({
                  category: savedCategory,
                  subscribed_at: new Date().toISOString()
                })
                
                localStorage.setItem("notificationSubscription", JSON.stringify({
                  userId: newOnesignalId,
                  category: savedCategory,
                  subscribedAt: new Date().toISOString()
                }))
              }
            } else {
              localStorage.removeItem("notificationSubscription")
            }
          })

          OneSignalInstance.Notifications.addEventListener("permissionChange", (permission) => {
            setOneSignalState((prev) => ({ ...prev, permission }))
          })
        } else {
          throw new Error("Push notifications are not supported in this browser")
        }
      } catch (error) {
        console.error("OneSignal initialization error:", error)
        setOneSignalState({
          isLoading: false,
          isInitialized: true,
          isSubscribed: false,
          permission: "default",
          userId: null,
          error: error.message,
        })
      }
    }

    initializeOneSignal()
  }, [appConfig, configLoading])

  // Update subscription data when state changes
  useEffect(() => {
    const updateSubscriptionData = async () => {
      if (oneSignalState.isSubscribed && selectedCategory && oneSignalState.userId && window.OneSignal) {
        try {
          await window.OneSignal.User.addTags({
            category: selectedCategory,
            last_updated: new Date().toISOString()
          })
          
          console.log('Tags updated for user:', oneSignalState.userId, { category: selectedCategory })
        } catch (error) {
          console.error("Error updating tags:", error)
        }
        
        localStorage.setItem("notificationSubscription", JSON.stringify({
          userId: oneSignalState.userId,
          category: selectedCategory,
          subscribedAt: new Date().toISOString()
        }))
      }
    }
    
    updateSubscriptionData()
  }, [selectedCategory, oneSignalState.isSubscribed, oneSignalState.userId])

  const handleSubscribe = async () => {
    try {
      if (!window.OneSignal || !selectedCategory) {
        return
      }

      // Use the prompt method
      await window.OneSignal.Slidedown.promptPush()
      
      // Wait a bit for the subscription to complete
      setTimeout(async () => {
        const onesignalId = await window.OneSignal.User.onesignalId
        if (onesignalId) {
          console.log('User subscribed with ID:', onesignalId)
        }
      }, 2000)
    } catch (error) {
      console.error("Subscribe error:", error)
    }
  }

  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId)
    localStorage.setItem("selectedNotificationCategory", categoryId)

    const category = categories.find((cat) => cat.id === categoryId)

    if (category) {
      // Use react-push-notification for category change
      addNotification({
        title: `You've selected ${category.name} notifications`,
        subtitle: category.name,
        message: `${category.txt}`,
        theme: 'darkblue',
        native: true,
        duration: 5000,
        vibrate: 1,
        onClick: () => console.log('Notification clicked'),
      })
      
      // If already subscribed, update OneSignal tags
      if (oneSignalState.isSubscribed && oneSignalState.userId && window.OneSignal) {
        try {
          await window.OneSignal.User.addTags({
            category: categoryId,
            category_name: category.name,
            updated_at: new Date().toISOString()
          })
          
          console.log('Category updated for user:', oneSignalState.userId, categoryId)
          
          localStorage.setItem("notificationSubscription", JSON.stringify({
            userId: oneSignalState.userId,
            category: categoryId,
            subscribedAt: new Date().toISOString()
          }))
        } catch (error) {
          console.error("Error updating OneSignal tags:", error)
        }
      }
    }
  }

  // Show loading state while checking config
  if (configLoading) {
    return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading configuration...</span>
        </div>
      </div>
    )
  }

  // Show maintenance message if app is disabled
  if (appConfig && !appConfig.appEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <XCircle className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Service Unavailable</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {appConfig.maintenanceMessage || "The notification service is temporarily unavailable. Please try again later."}
            </p>
            {appConfig.lastUpdated && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Last updated: {new Date(appConfig.lastUpdated).toLocaleString()}
              </p>
            )}
            {lastConfigCheck && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Config checked: {lastConfigCheck.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Notification Preferences</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Select a category to receive tailored push notifications.</p>
        </div>

        {/* Config Error Alert */}
        {configError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Configuration Warning</h3>
                <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {configError}. The app is running with default settings.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Choose Your Category</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Select the type of notifications you'd like to receive</p>
            
            <div className="space-y-4">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-start p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.id}
                    checked={selectedCategory === category.id}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{category.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{category.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Subscribe Button */}
            {!oneSignalState.isSubscribed && (
              <div className="mt-6">
                <button
                  onClick={handleSubscribe}
                  disabled={!selectedCategory || !oneSignalState.isInitialized || oneSignalState.isLoading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Enable Notifications
                </button>
                {!selectedCategory && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                    Please select a category first
                  </p>
                )}
              </div>
            )}

            {/* Success Message */}
            {oneSignalState.isSubscribed && (
              <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Notifications enabled for {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                </div>
              </div>
            )}

            {/* Error Messages */}
            {oneSignalState.permission === "denied" && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Notifications Blocked</h3>
                    <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                      Please enable notifications in your browser settings to continue.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {oneSignalState.error && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                    <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {oneSignalState.error}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Nader Mahbub Khan</p>
        </footer>
      </div>
    </div>
  )
}
