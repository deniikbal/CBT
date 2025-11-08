import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

interface SecurityConfig {
  hasilUjianId: string
  pesertaId: string
  maxBlurCount?: number
  enableFullscreen?: boolean
  enableRightClickBlock?: boolean
  initialBlurCount?: number
  autoSubmitOnViolation?: boolean
  onAutoSubmit?: () => void
}

export function useExamSecurity({
  hasilUjianId,
  pesertaId,
  maxBlurCount = 5,
  enableFullscreen = true,
  enableRightClickBlock = true,
  initialBlurCount = 0,
  autoSubmitOnViolation = false,
  onAutoSubmit,
}: SecurityConfig) {
  const router = useRouter()
  const [blurCount, setBlurCount] = useState(initialBlurCount)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const sessionId = useRef<string>(uuidv4())
  const sessionCheckInterval = useRef<NodeJS.Timeout>()

  // Update blurCount when initialBlurCount changes (from database)
  useEffect(() => {
    setBlurCount(initialBlurCount)
  }, [initialBlurCount])

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const smallScreen = window.innerWidth < 768
      setIsMobile(mobile || smallScreen)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Log activity function with useCallback to avoid recreation
  const logActivity = useCallback(async (
    activityType: string,
    count?: number,
    metadata?: any
  ) => {
    // Skip if not ready yet
    if (!hasilUjianId || hasilUjianId === 'pending' || !pesertaId || pesertaId === 'pending') {
      return
    }

    try {
      await fetch('/api/ujian/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasilUjianId,
          pesertaId,
          activityType,
          count,
          metadata,
        }),
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }, [hasilUjianId, pesertaId])

  // Initialize session
  useEffect(() => {
    // Skip if not ready yet
    if (!hasilUjianId || hasilUjianId === 'pending' || !pesertaId || pesertaId === 'pending') return

    const initSession = async () => {
      // Get IP address (optional, fallback if API fails)
      let ipAddress = null
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
        
        const ipResponse = await fetch('https://api.ipify.org?format=json', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (ipResponse.ok) {
          const ipData = await ipResponse.json()
          ipAddress = ipData.ip
        }
      } catch (error) {
        // Silently fail - IP tracking is optional
        // No need to log error to console
      }

      // Save session to database
      try {
        await fetch('/api/ujian/update-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hasilUjianId,
            sessionId: sessionId.current,
            ipAddress,
          }),
        })
      } catch (error) {
        console.error('Failed to update session:', error)
      }

      // Store session in localStorage
      localStorage.setItem(`exam_session_${hasilUjianId}`, sessionId.current)
    }

    initSession()

    // Cleanup on unmount
    return () => {
      localStorage.removeItem(`exam_session_${hasilUjianId}`)
    }
  }, [hasilUjianId, pesertaId])

  // Session check (prevent multiple logins)
  useEffect(() => {
    // Skip if not ready yet
    if (!hasilUjianId || hasilUjianId === 'pending' || !pesertaId || pesertaId === 'pending') return

    sessionCheckInterval.current = setInterval(async () => {
      try {
        const response = await fetch('/api/ujian/check-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hasilUjianId,
            sessionId: sessionId.current,
          }),
        })

        const data = await response.json()

        if (!data.isValid) {
          // Session mismatch - someone else logged in
          clearInterval(sessionCheckInterval.current)
          logActivity('SESSION_VIOLATION')
          toast.error('Ujian diakses dari device lain! Halaman ini akan ditutup.')
          
          setTimeout(() => {
            router.push('/student/ujian')
          }, 3000)
        }
      } catch (error) {
        console.error('Session check failed:', error)
      }
    }, 10000) // Check every 10 seconds

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
      }
    }
  }, [hasilUjianId, pesertaId, router])

  // Window blur detection
  useEffect(() => {
    // Skip if not ready yet
    if (!hasilUjianId || hasilUjianId === 'pending' || !pesertaId || pesertaId === 'pending') return

    const handleBlur = async () => {
      const newCount = blurCount + 1
      setBlurCount(newCount)
      
      // Log activity - call directly without closure
      try {
        await fetch('/api/ujian/log-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hasilUjianId,
            pesertaId,
            activityType: 'TAB_BLUR',
            count: newCount,
          }),
        })
      } catch (error) {
        console.error('Failed to log TAB_BLUR:', error)
      }

      if (newCount >= maxBlurCount) {
        // Check if auto submit is enabled
        if (autoSubmitOnViolation && onAutoSubmit) {
          toast.error(
            `Anda terlalu sering keluar dari tab ujian (${newCount}x). Jawaban akan otomatis terkirim!`,
            { duration: 8000 }
          )
          
          // Log force submit activity
          try {
            await fetch('/api/ujian/log-activity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                hasilUjianId,
                pesertaId,
                activityType: 'FORCE_SUBMIT',
                metadata: JSON.stringify({ reason: 'Max blur exceeded, auto submit' }),
              }),
            })
          } catch (error) {
            console.error('Failed to log FORCE_SUBMIT:', error)
          }
          
          // Trigger auto submit after short delay
          setTimeout(() => {
            onAutoSubmit()
          }, 2000)
        } else {
          // Original behavior: disable account
          toast.error(
            `Anda terlalu sering keluar dari tab ujian (${newCount}x). Akun Anda akan dinonaktifkan!`,
            { duration: 8000 }
          )
          
          // Log account disable activity
          try {
            await fetch('/api/ujian/log-activity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                hasilUjianId,
                pesertaId,
                activityType: 'SESSION_VIOLATION',
                metadata: JSON.stringify({ reason: 'Max blur exceeded, account disabled' }),
              }),
            })
          } catch (error) {
            console.error('Failed to log SESSION_VIOLATION:', error)
          }
          
          // Disable account immediately
          try {
            const response = await fetch(`/api/peserta/${pesertaId}/disable`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: 'Pelanggaran keamanan ujian (keluar tab > 5x)' })
            })
            
            const data = await response.json()
            
            if (response.ok) {
              toast.error('Akun Anda telah dinonaktifkan. Hubungi pengawas untuk mengaktifkan kembali.', {
                duration: 5000
              })
              
              // Logout after 3 seconds
              setTimeout(() => {
                localStorage.removeItem('peserta')
                window.location.href = '/login'
              }, 3000)
            } else {
              console.error('Failed to disable account:', data)
              toast.error('Terjadi kesalahan saat menonaktifkan akun')
            }
          } catch (error) {
            console.error('Error calling disable API:', error)
            toast.error('Terjadi kesalahan sistem')
          }
        }
      } else {
        toast.warning(
          `⚠️ Peringatan! Anda keluar dari tab ujian (${newCount}/${maxBlurCount})`,
          { duration: 5000 }
        )
      }
    }

    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('blur', handleBlur)
    }
  }, [hasilUjianId, pesertaId, maxBlurCount, blurCount])

  // Fullscreen enforcement - now enabled on mobile
  useEffect(() => {
    if (!enableFullscreen) return

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement

      if (!isNowFullscreen && isFullscreen) {
        // User exited fullscreen
        logActivity('EXIT_FULLSCREEN')
        toast.warning('⚠️ Mode fullscreen disarankan untuk ujian', { duration: 3000 })
      }

      setIsFullscreen(isNowFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    // Mobile webkit browsers
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [enableFullscreen, isFullscreen])

  // Disable right-click and keyboard shortcuts
  useEffect(() => {
    // Skip if not ready or not enabled yet
    if (!enableRightClickBlock) return
    if (!hasilUjianId || hasilUjianId === 'pending' || !pesertaId || pesertaId === 'pending') return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      logActivity('RIGHT_CLICK')
      toast.warning('Right-click dinonaktifkan selama ujian', { duration: 2000 })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C (Copy)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault()
        logActivity('COPY_ATTEMPT')
        toast.warning('Copy dinonaktifkan', { duration: 2000 })
      }

      // Ctrl+V (Paste)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        logActivity('PASTE_ATTEMPT')
        toast.warning('Paste dinonaktifkan', { duration: 2000 })
      }

      // F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault()
        logActivity('ATTEMPTED_DEVTOOLS')
        toast.error('⚠️ DevTools tidak diperbolehkan!', { duration: 3000 })
      }

      // Ctrl+Shift+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault()
        logActivity('ATTEMPTED_DEVTOOLS')
        toast.error('⚠️ DevTools tidak diperbolehkan!', { duration: 3000 })
      }

      // Ctrl+Shift+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault()
        logActivity('ATTEMPTED_DEVTOOLS')
        toast.error('⚠️ Console tidak diperbolehkan!', { duration: 3000 })
      }

      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault()
        logActivity('ATTEMPTED_DEVTOOLS')
      }

      // Print Screen
      if (e.key === 'PrintScreen') {
        logActivity('SCREENSHOT_ATTEMPT')
        toast.warning('⚠️ Screenshot terdeteksi!', { duration: 3000 })
      }
    }

    // Disable copy event
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      logActivity('COPY_ATTEMPT')
    }

    // Disable paste event  
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      logActivity('PASTE_ATTEMPT')
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
    }
  }, [enableRightClickBlock])

  // Page visibility change - DISABLED to prevent duplicate TAB_BLUR logging
  // Window blur event already handles this, so we don't need duplicate logs
  // useEffect(() => {
  //   if (!hasilUjianId || hasilUjianId === 'pending' || !pesertaId || pesertaId === 'pending') return

  //   const handleVisibilityChange = () => {
  //     if (document.hidden) {
  //       logActivity('TAB_BLUR')
  //     }
  //   }

  //   document.addEventListener('visibilitychange', handleVisibilityChange)

  //   return () => {
  //     document.removeEventListener('visibilitychange', handleVisibilityChange)
  //   }
  // }, [hasilUjianId, pesertaId])

  // Fullscreen request function (manual) - now supports mobile
  const requestFullscreen = async (): Promise<boolean> => {
    if (!enableFullscreen) {
      return false
    }

    try {
      const elem = document.documentElement as any
      
      // Try standard fullscreen API
      if (elem.requestFullscreen) {
        await elem.requestFullscreen()
        return true
      }
      // Try webkit fullscreen (iOS Safari)
      else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen()
        return true
      }
      // Try webkit enter fullscreen (older iOS)
      else if (elem.webkitEnterFullscreen) {
        await elem.webkitEnterFullscreen()
        return true
      }
      // Try moz fullscreen (Firefox)
      else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen()
        return true
      }
      // Try ms fullscreen (IE/Edge)
      else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen()
        return true
      }
      else {
        console.warn('Fullscreen API not supported on this device')
        toast.warning('Browser Anda tidak mendukung mode fullscreen', { duration: 5000 })
        return false
      }
    } catch (error) {
      console.error('Fullscreen request error:', error)
      if (isMobile) {
        toast.info('Mode fullscreen mungkin tidak tersedia di browser mobile Anda', { duration: 5000 })
      }
      return false
    }
  }

  return {
    blurCount,
    isFullscreen,
    logActivity,
    requestFullscreen,
  }
}
