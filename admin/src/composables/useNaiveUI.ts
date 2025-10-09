import { useDialog, useLoadingBar, useMessage, useNotification } from 'naive-ui'

/**
 * Composable để sử dụng các Naive UI services
 * Bao gồm message, dialog, notification, và loading bar
 */
export function useNaiveUI() {
  const message = useMessage()
  const dialog = useDialog()
  const notification = useNotification()
  const loadingBar = useLoadingBar()

  // Message helpers
  const showSuccess = (content: string) => {
    message.success(content)
  }

  const showError = (content: string) => {
    message.error(content)
  }

  const showWarning = (content: string) => {
    message.warning(content)
  }

  const showInfo = (content: string) => {
    message.info(content)
  }

  // Dialog helpers
  const showConfirm = (title: string, content: string) => {
    return new Promise((resolve) => {
      dialog.warning({
        title,
        content,
        positiveText: 'Confirm',
        negativeText: 'Cancel',
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
      })
    })
  }

  const showDeleteConfirm = (
    title: string = 'Delete Confirmation',
    content: string = 'Are you sure you want to delete this item?',
  ) => {
    return new Promise((resolve) => {
      dialog.error({
        title,
        content,
        positiveText: 'Delete',
        negativeText: 'Cancel',
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
      })
    })
  }

  // Notification helpers
  const showNotification = (
    title: string,
    content?: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
  ) => {
    notification[type]({
      title,
      content,
      duration: 3000,
    })
  }

  // Loading helpers
  const startLoading = () => {
    loadingBar.start()
  }

  const finishLoading = () => {
    loadingBar.finish()
  }

  const errorLoading = () => {
    loadingBar.error()
  }

  return {
    // Original services
    message,
    dialog,
    notification,
    loadingBar,

    // Helper methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showDeleteConfirm,
    showNotification,
    startLoading,
    finishLoading,
    errorLoading,
  }
}
