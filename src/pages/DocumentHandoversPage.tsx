import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  AlertCircle,
  RotateCcw,
  History,
  FileText,
  Clock,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchInput } from '../components/forms/SearchInput';
import { SelectInput } from '../components/forms/SelectInput';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { useAppState } from '../context/AppStateContext';
import {
  documentService,
  HANDOVER_STATUSES,
} from '../services/documentService';
import {
  HandoverRecord,
  HandoverStatus,
  DocumentRecord,
} from '../types/document';
import { CustomerOption } from '../types/taskFollowUp';

export const DocumentHandoversPage: React.FC = () => {
  const { isEmptyStateMode } = useAppState();

  // Search & Filters state
  const [search, setSearch] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Handovers, Customers, and Documents state
  const [handovers, setHandovers] = useState<HandoverRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [allDocuments, setAllDocuments] = useState<DocumentRecord[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [viewingHandover, setViewingHandover] = useState<HandoverRecord | null>(null);
  const [editingHandover, setEditingHandover] = useState<HandoverRecord | null>(null);
  const [historyTargetHandover, setHistoryTargetHandover] = useState<HandoverRecord | null>(null);
  const [deletingHandoverId, setDeletingHandoverId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState<{
    customerId: string;
    customerName: string;
    documentId: string;
    documentName: string;
    handoverDate: string;
    givenBy: string;
    receivedBy: string;
    notes: string;
    status: HandoverStatus;
  }>({
    customerId: '',
    customerName: '',
    documentId: '',
    documentName: '',
    handoverDate: new Date().toISOString().slice(0, 10),
    givenBy: 'S. Mehta (Senior Case Officer)',
    receivedBy: '',
    notes: '',
    status: 'Recorded',
  });

  const [formError, setFormError] = useState<string>('');

  // Refresh handovers
  const refreshHandovers = () => {
    const list = documentService.getHandovers({
      isEmptyState: isEmptyStateMode,
      search,
      customerId: selectedCustomerId,
      status: selectedStatus,
    });
    setHandovers(list);
    setAllDocuments(documentService.getDocuments({ isEmptyState: isEmptyStateMode }));
  };

  useEffect(() => {
    refreshHandovers();
  }, [isEmptyStateMode, search, selectedCustomerId, selectedStatus]);

  useEffect(() => {
    documentService.getAvailableCustomers().then((res) => {
      setCustomers(res);
      if (res.length > 0 && !formData.customerId) {
        setFormData((prev) => ({
          ...prev,
          customerId: res[0].id,
          customerName: res[0].name,
        }));
      }
    });
  }, []);

  // Filtered documents for the selected customer in Add Modal
  const availableCustomerDocuments = useMemo(() => {
    if (!formData.customerId) return [];
    return documentService.getDocumentsForCustomer(formData.customerId, isEmptyStateMode);
  }, [formData.customerId, isEmptyStateMode, allDocuments]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    const defaultCust = customers[0] || { id: '', name: '' };
    const custDocs = documentService.getDocumentsForCustomer(defaultCust.id, isEmptyStateMode);
    const firstDoc = custDocs[0] || { id: '', documentName: '' };

    setFormData({
      customerId: defaultCust.id,
      customerName: defaultCust.name,
      documentId: firstDoc.id,
      documentName: firstDoc.documentName,
      handoverDate: new Date().toISOString().slice(0, 10),
      givenBy: 'S. Mehta (Senior Case Officer)',
      receivedBy: `${defaultCust.name} (Applicant)`,
      notes: '',
      status: 'Handed Over',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Submit Add Handover
  const handleCreateHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setFormError('Please select a customer.');
      return;
    }
    if (!formData.documentId) {
      setFormError('Please select a document from customer records.');
      return;
    }
    if (!formData.handoverDate) {
      setFormError('Handover date is required.');
      return;
    }
    if (!formData.givenBy.trim()) {
      setFormError('Given by party is required.');
      return;
    }
    if (!formData.receivedBy.trim()) {
      setFormError('Received by party is required.');
      return;
    }

    const selectedCust = customers.find((c) => c.id === formData.customerId);
    const selectedDoc = availableCustomerDocuments.find((d) => d.id === formData.documentId);

    documentService.createHandover({
      customerId: formData.customerId,
      customerName: selectedCust ? selectedCust.name : formData.customerName,
      documentId: formData.documentId,
      documentName: selectedDoc ? selectedDoc.documentName : formData.documentName,
      handoverDate: formData.handoverDate,
      givenBy: formData.givenBy,
      receivedBy: formData.receivedBy,
      notes: formData.notes,
      status: formData.status,
    });

    setIsAddModalOpen(false);
    refreshHandovers();
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: HandoverRecord) => {
    setEditingHandover(item);
    setFormData({
      customerId: item.customerId,
      customerName: item.customerName,
      documentId: item.documentId,
      documentName: item.documentName,
      handoverDate: item.handoverDate,
      givenBy: item.givenBy,
      receivedBy: item.receivedBy,
      notes: item.notes || '',
      status: item.status,
    });
    setFormError('');
  };

  // Submit Edit Handover
  const handleUpdateHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHandover) return;
    if (!formData.handoverDate) {
      setFormError('Handover date is required.');
      return;
    }
    if (!formData.givenBy.trim()) {
      setFormError('Given by party is required.');
      return;
    }
    if (!formData.receivedBy.trim()) {
      setFormError('Received by party is required.');
      return;
    }

    documentService.updateHandover(editingHandover.id, {
      handoverDate: formData.handoverDate,
      givenBy: formData.givenBy,
      receivedBy: formData.receivedBy,
      notes: formData.notes,
      status: formData.status,
    });

    setEditingHandover(null);
    refreshHandovers();
    if (viewingHandover && viewingHandover.id === editingHandover.id) {
      setViewingHandover(documentService.getHandoverById(editingHandover.id));
    }
  };

  // Delete Handover
  const handleDeleteHandover = (id: string) => {
    documentService.deleteHandover(id);
    setDeletingHandoverId(null);
    if (viewingHandover && viewingHandover.id === id) {
      setViewingHandover(null);
    }
    refreshHandovers();
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedCustomerId('All');
    setSelectedStatus('All');
  };

  // Helper for handover badge styling
  const getHandoverBadgeVariant = (status: HandoverStatus) => {
    switch (status) {
      case 'Submitted to Embassy':
      case 'Completed':
        return 'completed';
      case 'Handed Over':
      case 'In Custody':
        return 'in-process';
      case 'Recorded':
      default:
        return 'neutral';
    }
  };

  // Related handovers for History modal
  const relatedHandovers = useMemo(() => {
    if (!historyTargetHandover) return [];
    return documentService.getHandoversForDocument(
      historyTargetHandover.documentId,
      isEmptyStateMode
    );
  }, [historyTargetHandover, isEmptyStateMode, handovers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Document Handovers & Chain of Custody"
        subtitle="Track physical document custody handovers, embassy courier dispatches, and applicant acknowledgment signatures"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAddModal}
          >
            New Handover Record
          </Button>
        }
      />

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by customer name, document name, parties, or Ref..."
              value={search}
              onSearchChange={setSearch}
            />
          </div>
          <div className="w-full md:w-52">
            <SelectInput
              options={[
                { value: 'All', label: 'All Customers' },
                ...customers.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.id})`,
                })),
              ]}
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <SelectInput
              options={[
                { value: 'All', label: 'All Statuses' },
                ...HANDOVER_STATUSES.map((st) => ({ value: st, label: st })),
              ]}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
          {(search || selectedCustomerId !== 'All' || selectedStatus !== 'All') && (
            <Button
              variant="secondary"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Handover Listing or Empty State */}
      {isEmptyStateMode &&
      handovers.length === 0 &&
      !search &&
      selectedCustomerId === 'All' &&
      selectedStatus === 'All' ? (
        <EmptyState
          title="No Custody Handovers Recorded"
          description="There are currently no physical document release or submission handovers recorded. Log your first custody movement record."
          actionText="Log First Handover"
          onAction={handleOpenAddModal}
        />
      ) : handovers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No matching handovers found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or clearing selected customer filters.
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5 whitespace-nowrap">Handover Ref</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Customer Name</th>
                  <th className="px-4 py-3.5">Document Name</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Given By</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Received By</th>
                  <th className="px-4 py-3.5">Handover Notes</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {handovers.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap align-top">
                      <span className="font-mono font-medium text-slate-700">
                        {item.id}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 align-top whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.handoverDate}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{item.customerName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 pl-5">
                        {item.customerId}
                      </div>
                    </td>

                    {/* Document */}
                    <td className="px-4 py-3.5 align-top max-w-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 leading-snug">
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{item.documentName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono pl-5">
                        {item.documentId}
                      </span>
                    </td>

                    {/* Given By */}
                    <td className="px-4 py-3.5 align-top text-slate-700 font-medium">
                      {item.givenBy}
                    </td>

                    {/* Received By */}
                    <td className="px-4 py-3.5 align-top text-slate-700 font-medium">
                      {item.receivedBy}
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3.5 align-top max-w-xs text-slate-500">
                      <div className="line-clamp-2 leading-relaxed">
                        {item.notes || '—'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                      <Badge variant={getHandoverBadgeVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View History */}
                        <button
                          title="View Custody History"
                          onClick={() => setHistoryTargetHandover(item)}
                          className="p-1 rounded text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* View Details */}
                        <button
                          title="View Handover Details"
                          onClick={() => setViewingHandover(item)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          title="Edit Handover Record"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          title="Delete Handover"
                          onClick={() => setDeletingHandoverId(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Handover Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Document Handover"
        subtitle="Log physical custody transfer, courier dispatch, or applicant release"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateHandover}>
              Log Handover Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateHandover} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Customer <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.customerId}
              onChange={(e) => {
                const id = e.target.value;
                const c = customers.find((cust) => cust.id === id);
                const docs = documentService.getDocumentsForCustomer(id, isEmptyStateMode);
                const firstDoc = docs[0];
                setFormData({
                  ...formData,
                  customerId: id,
                  customerName: c ? c.name : '',
                  documentId: firstDoc ? firstDoc.id : '',
                  documentName: firstDoc ? firstDoc.documentName : '',
                });
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Document from Customer Register <span className="text-rose-500">*</span>
            </label>
            {availableCustomerDocuments.length === 0 ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                No documents currently registered for this customer. Please register a document in the Documents module first.
              </div>
            ) : (
              <select
                required
                value={formData.documentId}
                onChange={(e) => {
                  const docId = e.target.value;
                  const doc = availableCustomerDocuments.find((d) => d.id === docId);
                  setFormData({
                    ...formData,
                    documentId: docId,
                    documentName: doc ? doc.documentName : '',
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                {availableCustomerDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.documentName} ({doc.category} — {doc.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Handover Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.handoverDate}
                onChange={(e) => setFormData({ ...formData, handoverDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Custody Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as HandoverStatus })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                {HANDOVER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Given By <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. S. Mehta (Senior Case Officer) or Customer"
                value={formData.givenBy}
                onChange={(e) => setFormData({ ...formData, givenBy: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Received By / Destination <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Applicant in-person, VFS Global, Embassy Courier"
                value={formData.receivedBy}
                onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Handover Notes & Waybill / Acknowledgment
            </label>
            <textarea
              rows={3}
              placeholder="Record courier tracking number, signed acknowledgment slip, or purpose..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>
        </form>
      </Modal>

      {/* Edit Handover Modal */}
      <Modal
        isOpen={!!editingHandover}
        onClose={() => setEditingHandover(null)}
        title={`Edit Handover Record: ${editingHandover?.id}`}
        subtitle={`Modify custody transfer record for ${editingHandover?.customerName}`}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingHandover(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateHandover}>
              Update Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateHandover} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-semibold text-slate-800">
              {editingHandover?.documentName}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Customer: {editingHandover?.customerName} ({editingHandover?.customerId})
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Handover Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.handoverDate}
                onChange={(e) => setFormData({ ...formData, handoverDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as HandoverStatus })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                {HANDOVER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Given By <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.givenBy}
                onChange={(e) => setFormData({ ...formData, givenBy: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Received By <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.receivedBy}
                onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>
        </form>
      </Modal>

      {/* View Handover Details Modal */}
      <Modal
        isOpen={!!viewingHandover}
        onClose={() => setViewingHandover(null)}
        title={viewingHandover ? `${viewingHandover.id} – Handover Details` : 'Handover Details'}
        subtitle="Complete record of custody movement and acknowledgment notes"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                const id = viewingHandover?.id;
                if (id) setDeletingHandoverId(id);
              }}
            >
              Delete
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (viewingHandover) {
                    const h = viewingHandover;
                    setViewingHandover(null);
                    handleOpenEditModal(h);
                  }
                }}
              >
                Edit Record
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (viewingHandover) {
                    const h = viewingHandover;
                    setViewingHandover(null);
                    setHistoryTargetHandover(h);
                  }
                }}
              >
                View History
              </Button>
            </div>
          </div>
        }
      >
        {viewingHandover && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Customer
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingHandover.customerName}
                </p>
                <span className="text-[10px] text-blue-600 font-mono">
                  {viewingHandover.customerId}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Handover Date
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingHandover.handoverDate}
                </p>
                <span className="text-[10px] text-slate-500">Recorded Transfer</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Given By
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingHandover.givenBy}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Received By
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingHandover.receivedBy}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Document Description
              </div>
              <div className="text-slate-800 font-semibold text-xs mt-1">
                {viewingHandover.documentName}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Reference ID: {viewingHandover.documentId}
              </span>
            </div>

            <div className="bg-blue-50/50 rounded-lg p-3.5 border border-blue-200/70">
              <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">
                Handover Notes & Waybill Reference
              </div>
              <div className="text-slate-800 font-medium text-xs mt-1.5 leading-relaxed whitespace-pre-wrap">
                {viewingHandover.notes || 'No specific custody notes recorded.'}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Status: {viewingHandover.status}</span>
              {viewingHandover.isDemo && (
                <span className="text-amber-600 font-medium">DEMO DATA</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Custody History Timeline Modal */}
      <Modal
        isOpen={!!historyTargetHandover}
        onClose={() => setHistoryTargetHandover(null)}
        title={`Custody History: ${historyTargetHandover?.documentName}`}
        subtitle={`Chain of custody events for document ${historyTargetHandover?.documentId}`}
        maxWidth="md"
        footer={
          <Button variant="secondary" onClick={() => setHistoryTargetHandover(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500">
            Timeline of recorded physical transfers and custody receipts for{' '}
            <strong className="text-slate-800">{historyTargetHandover?.customerName}</strong>.
          </p>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {relatedHandovers.map((h, idx) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/90 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{h.handoverDate}</span>
                    <Badge variant={getHandoverBadgeVariant(h.status)}>
                      {h.status}
                    </Badge>
                  </div>
                  <div className="text-slate-700">
                    <span className="text-slate-500">Released by:</span> <strong>{h.givenBy}</strong>
                    <span className="text-slate-400 mx-1.5">→</span>
                    <span className="text-slate-500">Received by:</span> <strong>{h.receivedBy}</strong>
                  </div>
                  {h.notes && (
                    <div className="text-[11px] text-slate-500 italic mt-1 pt-1 border-t border-slate-200/60">
                      "{h.notes}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingHandoverId}
        onClose={() => setDeletingHandoverId(null)}
        title="Confirm Handover Deletion"
        subtitle="This action will delete the custody movement record."
        maxWidth="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingHandoverId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deletingHandoverId) handleDeleteHandover(deletingHandoverId);
              }}
            >
              Delete Record
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Are you sure you want to delete handover record{' '}
          <strong className="text-slate-800">{deletingHandoverId}</strong>? This in-memory demo
          action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};
