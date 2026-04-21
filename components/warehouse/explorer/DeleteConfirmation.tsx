import { Trash2, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteConfirmationProps {
  deleteId: string | null
  setDeleteId: (id: string | null) => void
  resourceName?: string
  handleDelete: () => Promise<void>
  isPending: boolean
  title?: string
  description?: string
}

export const DeleteConfirmation = ({
  deleteId,
  setDeleteId,
  resourceName,
  handleDelete,
  isPending,
  title,
  description
}: DeleteConfirmationProps) => {
  return (
    <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
      <AlertDialogContent className="rounded-3xl border-border shadow-none p-8 max-w-md animate-in zoom-in-95 fade-in duration-300">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-destructive">
              <div className="p-3 rounded-2xl bg-destructive/10">
                  <Trash2 className="h-6 w-6" />
              </div>
              {title || "Confirm Deletion"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground/80 leading-relaxed pt-2">
            {description ? description : (
                <>
                    You are about to permanently remove <span className="font-bold text-foreground">"{resourceName}"</span>. 
                    This will erase all metadata and content associated with this resource from the central data warehouse. This action is irreversible.
                </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-8 gap-3">
          <AlertDialogCancel className="rounded-xl h-12 flex-1 text-[12px] font-bold border-muted-foreground/20 hover:bg-muted transition-all shadow-none">CANCEL</AlertDialogCancel>
          <AlertDialogAction 
              className="rounded-xl h-12 flex-1 text-[12px] font-black bg-destructive text-white hover:bg-destructive/90 shadow-none border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleDelete}
              disabled={isPending}
          >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "DELETE PERMANENTLY"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
