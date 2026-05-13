import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Swal from 'sweetalert2'
import { PageHeader } from '@/shared/ui/PageHeader'
import { LoadingState } from '@/shared/ui/LoadingState'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import type { Resolver } from 'react-hook-form'
import { useDeployRules, useCreateDeployRule, useUpdateDeployRule, useDeleteDeployRule } from '@/shared/hooks/useDeployRules'
import type { DeployRule } from '@/shared/types/deployRule'

const ruleSchema = z.object({
  pattern: z.string().min(1, 'Pattern is required'),
  action: z.string().min(1, 'Action is required'),
  order: z.coerce.number().int().min(0, 'Order must be a non-negative number'),
})

type RuleForm = z.infer<typeof ruleSchema>

export function RulesPage() {
  const { data: rules, isLoading } = useDeployRules()
  const createMutation = useCreateDeployRule()
  const updateMutation = useUpdateDeployRule()
  const deleteMutation = useDeleteDeployRule()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DeployRule | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema) as Resolver<RuleForm>,
  })

  const openCreate = () => {
    setEditing(null)
    reset({ pattern: '', action: '', order: 0 })
    setModalOpen(true)
  }

  const openEdit = (rule: DeployRule) => {
    setEditing(rule)
    reset({ pattern: rule.pattern, action: rule.action, order: rule.order })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const onSubmit = async (data: RuleForm) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: { ...data, id: editing.id, isEnabled: editing.isEnabled },
        })
        await Swal.fire({ icon: 'success', title: 'Rule updated', timer: 1500, showConfirmButton: false })
      } else {
        await createMutation.mutateAsync(data)
        await Swal.fire({ icon: 'success', title: 'Rule created', timer: 1500, showConfirmButton: false })
      }
      closeModal()
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save rule.' })
    }
  }

  const handleToggle = async (rule: DeployRule) => {
    try {
      await updateMutation.mutateAsync({
        id: rule.id,
        data: { pattern: rule.pattern, action: rule.action, order: rule.order, id: rule.id, isEnabled: !rule.isEnabled },
      })
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update rule.' })
    }
  }

  const handleDelete = async (rule: DeployRule) => {
    const result = await Swal.fire({
      title: 'Delete rule?',
      text: `Are you sure you want to delete the rule "${rule.pattern}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    })
    if (!result.isConfirmed) return
    try {
      await deleteMutation.mutateAsync(rule.id)
      await Swal.fire({ icon: 'success', title: 'Rule deleted', timer: 1500, showConfirmButton: false })
    } catch {
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete rule.' })
    }
  }

  if (isLoading) return <LoadingState message="Loading deploy rules..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deploy Rules"
        description="Configure deployment rules and patterns"
        actions={
          <Button onClick={openCreate} variant="primary">Add Rule</Button>
        }
      />

      {!rules?.length ? (
        <EmptyState
          title="No rules"
          description="Create your first deployment rule to get started."
          action={<Button onClick={openCreate} variant="primary">Add Rule</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pattern</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules!.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{rule.order}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{rule.pattern}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{rule.action}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <button onClick={() => handleToggle(rule)} className="cursor-pointer">
                      <StatusBadge status={rule.isEnabled ? 'Active' : 'Inactive'} />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => openEdit(rule)}
                      className="mr-3 font-medium text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rule)}
                      className="font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Rule' : 'Add Rule'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="pattern"
            label="Pattern"
            placeholder="e.g. *.dll"
            error={errors.pattern?.message}
            {...register('pattern')}
          />
          <Input
            id="action"
            label="Action"
            placeholder="e.g. Copy, Delete, Backup"
            error={errors.action?.message}
            {...register('action')}
          />
          <Input
            id="order"
            label="Order"
            type="number"
            placeholder="e.g. 1"
            error={errors.order?.message}
            {...register('order')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
