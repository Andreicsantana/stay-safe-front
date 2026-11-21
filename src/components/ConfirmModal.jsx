import * as Dialog from "@radix-ui/react-dialog";
import { WarningCircle, X } from "@phosphor-icons/react";
import Btn from "./Btn";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  isDestructive = false,
}) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-texto/50" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[480px] rounded-t-[16px] border-t border-borda bg-superficie px-5 pt-4 pb-8 focus-visible:outline-none">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-borda" aria-hidden="true" />
          <div className="mb-3 flex items-center justify-center">
            {isDestructive && (
              <WarningCircle size={36} weight="bold" className="text-emergencia" aria-hidden="true" />
            )}
          </div>
          <Dialog.Title className="m-0 text-center font-display text-[22px] font-bold text-texto">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 mb-6 text-center text-[17px] leading-relaxed text-texto-secundario">
            {message}
          </Dialog.Description>
          <div className="flex flex-col gap-3">
            <Btn
              onClick={onConfirm}
              variant={isDestructive ? "perigo" : "primario"}
              size="grande"
            >
              {confirmText}
            </Btn>
            <Dialog.Close asChild>
              <Btn onClick={onCancel} variant="secundario" size="normal">
                <X size={20} weight="bold" aria-hidden="true" />
                <span>{cancelText}</span>
              </Btn>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
