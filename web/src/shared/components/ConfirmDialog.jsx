import Button from './Button'
import Modal from './Modal'

export default function ConfirmDialog({
  isOpen,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onCancel}
      title={title}
      size="small"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="confirm-dialog__message">{message}</p>
    </Modal>
  )
}
