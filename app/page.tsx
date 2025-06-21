"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const ONE_SIGNAL_APP_ID = "7b2a710b-6926-4865-b66b-6f6abf85b0ee"

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

interface OneSignalState {
  isLoading: boolean
  isInitialized: boolean
  isSubscribed: boolean
  permission: string
  userId: string | null
  error: string | null
}

declare global {
  interface Window {
    OneSignal: any
    OneSignalDeferred: any[]
    OneSignalInitialized?: boolean
  }
}

export default function NotificationApp() {
  const [oneSignalState, setOneSignalState] = useState<OneSignalState>({
    isLoading: true,
    isInitialized: false,
    isSubscribed: false,
    permission: "default",
    userId: null,
    error: null,
  })
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const initializationRef = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem("selectedNotificationCategory")
    if (saved) {
      setSelectedCategory(saved)
    }

    const initializeOneSignal = async () => {
      if (initializationRef.current || window.OneSignalInitialized) {
        return
      }
      initializationRef.current = true

      try {
        if (typeof window === "undefined") {
          return
        }

        // Check if OneSignal is already initialized
        if (window.OneSignal && window.OneSignal.initialized) {
          const isPushSupported = window.OneSignal.Notifications.isPushSupported()
          if (isPushSupported) {
            const permission = window.OneSignal.Notifications.permission
            const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn
            const subscriptionId = isOptedIn ? await window.OneSignal.User.PushSubscription.id : null

            setOneSignalState({
              isLoading: false,
              isInitialized: true,
              isSubscribed: isOptedIn,
              permission,
              userId: subscriptionId,
              error: null,
            })
          }
          return
        }

        // Load OneSignal SDK
        await new Promise<void>((resolve, reject) => {
          if (window.OneSignal) {
            resolve()
            return
          }

          window.OneSignalDeferred = window.OneSignalDeferred || []

          const script = document.createElement("script")
          script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          script.async = true

          script.onload = () => {
            window.OneSignalDeferred.push(() => {
              resolve()
            })
          }

          script.onerror = (error) => {
            reject(new Error("Failed to load OneSignal SDK"))
          }

          document.head.appendChild(script)
        })

        const OneSignalInstance = await new Promise<any>((resolve) => {
          if (window.OneSignal) {
            resolve(window.OneSignal)
          } else {
            window.OneSignalDeferred.push((OneSignal: any) => {
              resolve(OneSignal)
            })
          }
        })

        // Determine the correct base path for GitHub Pages
        const isGitHubPages = window.location.hostname.includes("github.io")
        const repoName = "naderos" // Your repository name
        const basePath = isGitHubPages ? `/${repoName}` : ""
        const fullPath = isGitHubPages ? `/${repoName}/` : "/"

        // Initialize OneSignal with correct paths
       await OneSignalInstance.init({
  appId: ONE_SIGNAL_APP_ID,
  allowLocalhostAsSecureOrigin: true,
  notifyButton: {
    enable: false
  }
  // No need for custom serviceWorkerParam
});

        window.OneSignalInitialized = true

        const isPushSupported = OneSignalInstance.Notifications.isPushSupported()

        if (isPushSupported) {
          const permission = OneSignalInstance.Notifications.permission
          const isOptedIn = await OneSignalInstance.User.PushSubscription.optedIn

          if (isOptedIn) {
            const subscriptionId = await OneSignalInstance.User.PushSubscription.id

            setOneSignalState({
              isLoading: false,
              isInitialized: true,
              isSubscribed: true,
              permission,
              userId: subscriptionId,
              error: null,
            })

            if (selectedCategory) {
              await OneSignalInstance.User.addTag("category", selectedCategory)
            }
          } else {
            setOneSignalState({
              isLoading: false,
              isInitialized: true,
              isSubscribed: false,
              permission,
              userId: null,
              error: null,
            })
          }

          // Set up event listeners
          OneSignalInstance.User.PushSubscription.addEventListener("change", async (event: any) => {
            const isNowOptedIn = event.current.optedIn
            const newId = event.current.id

            setOneSignalState((prev) => ({
              ...prev,
              isSubscribed: isNowOptedIn,
              userId: isNowOptedIn ? newId : null,
            }))

            if (isNowOptedIn && selectedCategory) {
              await OneSignalInstance.User.addTag("category", selectedCategory)
            }
          })

          OneSignalInstance.Notifications.addEventListener("permissionChange", (permission: string) => {
            setOneSignalState((prev) => ({ ...prev, permission }))
          })
        } else {
          throw new Error("Push notifications are not supported in this browser")
        }
      } catch (error: any) {
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
  }, [])

  useEffect(() => {
    if (oneSignalState.isSubscribed && selectedCategory && window.OneSignal) {
      window.OneSignal.User.addTag("category", selectedCategory).catch((error: any) => {
        console.error("Error updating tag:", error)
      })
    }
  }, [selectedCategory, oneSignalState.isSubscribed])

  const showCustomNotification = (message: string) => {
    setNotificationMessage(message)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 5000)
  }

  const handleSubscribe = async () => {
    try {
      if (!window.OneSignal || !selectedCategory) {
        return
      }

      await window.OneSignal.Slidedown.promptPush()
    } catch (error) {
      console.error("Subscribe error:", error)
    }
  }

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId)
    localStorage.setItem("selectedNotificationCategory", categoryId)

    const category = categories.find((cat) => cat.id === categoryId)

    if (category) {
      showCustomNotification(`Subscribed to ${category.name}: ${category.txt}`)
    }
  }

  const renderStatus = () => {
    if (oneSignalState.isLoading) {
      return (
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Initializing Notification Service...</span>
        </div>
      )
    }

    if (oneSignalState.error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {oneSignalState.error}
            <div className="mt-2 text-sm">
              <strong>Troubleshooting:</strong>
              <ul className="list-disc ml-4 mt-1">
                <li>Make sure you're accessing the site via HTTPS</li>
                <li>Check if service worker files are accessible</li>
                <li>Try refreshing the page</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    if (oneSignalState.permission === "denied") {
      return (
        <Alert variant="destructive">
          <AlertTitle>Notifications Blocked</AlertTitle>
          <AlertDescription>
            You have blocked notifications. Please enable them in your browser settings:
            <ol className="mt-2 ml-4 list-decimal text-sm">
              <li>Click the lock icon in your address bar</li>
              <li>Find &quot;Notifications&quot; in the permissions</li>
              <li>Change it to &quot;Allow&quot;</li>
              <li>Refresh this page</li>
            </ol>
          </AlertDescription>
        </Alert>
      )
    }

    if (!oneSignalState.isSubscribed) {
      return (
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            {selectedCategory
              ? "Click below to enable notifications for your selected category"
              : "Please select a category first, then enable notifications"}
          </p>
          <Button
            onClick={handleSubscribe}
            disabled={!selectedCategory || !oneSignalState.isInitialized}
            className="w-full"
            size="lg"
          >
            <Bell className="mr-2 h-4 w-4" />
            Enable Notifications
          </Button>
        </div>
      )
    }

    return (
      <Alert className="border-green-600 bg-green-50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-600">Notifications Enabled!</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          <div>Your User ID: {oneSignalState.userId || "Loading..."}</div>
          <div>Category: {selectedCategory || "None selected"}</div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        {/* Custom Notification */}
        {showNotification && (
          <div className="fixed top-4 right-4 z-50 max-w-sm">
            <Alert className="border-blue-600 bg-blue-50 dark:bg-blue-950/20">
              <Bell className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-600">Notification</AlertTitle>
              <AlertDescription className="text-sm">{notificationMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Notification Preferences</h1>
          <p className="text-muted-foreground mt-2">Select a category to receive tailored push notifications.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notification Status</CardTitle>
          </CardHeader>
          <CardContent>{renderStatus()}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Choose Your Category</CardTitle>
            <CardDescription>Select the type of notifications you&apos;d like to receive</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedCategory || ""} onValueChange={handleCategoryChange} className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <RadioGroupItem value={category.id} id={category.id} />
                  <Label htmlFor={category.id} className="flex-1 cursor-pointer space-y-1">
                    <div className="font-semibold">{category.name}</div>
                    <div className="text-sm text-muted-foreground">{category.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <footer className="text-center text-sm text-muted-foreground">
          <p>Nader Mahbub Khan</p>
        </footer>
      </div>
    </div>
  )
}
