'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { UseFormReturn } from 'react-hook-form'
import { RoleFormValues } from '@/resources/RBACResource'

interface RoleDialogsProps {
    isCreateOpen: boolean
    setIsCreateOpen: (open: boolean) => void
    isEditOpen: boolean
    setIsEditOpen: (open: boolean) => void
    createForm: UseFormReturn<RoleFormValues>
    editForm: UseFormReturn<RoleFormValues>
    onCreate: (values: RoleFormValues) => void
    onEdit: (values: RoleFormValues) => void
    createLoading: boolean
    editLoading: boolean
}

export function RoleDialogs({
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    createForm,
    editForm,
    onCreate,
    onEdit,
    createLoading,
    editLoading
}: RoleDialogsProps) {
    return (
        <>
            {/* Create Role Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                        <DialogDescription>Define a new security profile for your platform.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Role Name</Label>
                            <Input {...createForm.register('name')} placeholder="e.g. Moderator" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={createForm.handleSubmit(onCreate)} disabled={createLoading}>
                            {createLoading ? 'Creating...' : 'Create Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Role</DialogTitle>
                        <DialogDescription>Change the display name for the selected security profile.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Role Name</Label>
                            <Input {...editForm.register('name')} placeholder="e.g. Admin" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={editForm.handleSubmit(onEdit)} disabled={editLoading}>
                            {editLoading ? 'Saving...' : 'Save Name'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
