import React, { useState, useEffect, useMemo } from 'react';
import {
  Folder,
  Plus,
  FileText,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  AlertCircle,
  RotateCcw,
  Tag,
  ShieldCheck,
  CheckCircle,
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
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
} from '../services/documentService';
import {
  DocumentRecord,
  DocumentCategory,
  DocumentStatus,
} from '../types/document';
import { CustomerOption } from '../types/taskFollowUp';

export const DocumentsPage: React.FC = () => {
  const { isEmptyStateMode } = useAppState();

  // Search & Filters state
  const [search, setSearch] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Documents & Customers state
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [viewingDoc, setViewingDoc] = useState<DocumentRecord | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState<{
    customerId: string;
    customerName: string;
    documentName: string;
    category: DocumentCategory;
    receivedDate: string;
    status: DocumentStatus;
    remarks: string;
  }>({
    customerId: '',
    customerName: '',
    documentName: '',
    category: 'Passport',
    receivedDate: new Date().toISOString().slice(0, 10),
    status: 'Received',
    remarks: '',
  });

  const [formError, setFormError] = useState<string>('');

  // Refresh documents list
  const refreshDocuments = () => {
    const list = documentService.getDocuments({
      isEmptyState: isEmptyStateMode,
      search,
      customerId: selectedCustomerId,
      category: selectedCategory,
      status: selectedStatus,
    });
    setDocuments(list);
  };

  useEffect(() => {
    refreshDocuments();
  }, [isEmptyStateMode, search, selectedCustomerId, selectedCategory, selectedStatus]);

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

  // Open Add Modal
  const handleOpenAddModal = () => {
    const defaultCust = customers[0] || { id: '', name: '' };
    setFormData({
      customerId: defaultCust.id,
      customerName: defaultCust.name,
      documentName: '',
      category: 'Passport',
      receivedDate: new Date().toISOString().slice(0, 10),
      status: 'Received',
      remarks: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Submit Add Document Record
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setFormError('Please select a customer.');
      return;
    }
    if (!formData.documentName.trim()) {
      setFormError('Document name is required.');
      return;
    }
    if (!formData.receivedDate) {
      setFormError('Received date is required.');
      return;
    }

    const selectedCust = customers.find((c) => c.id === formData.customerId);

    documentService.createDocument({
      customerId: formData.customerId,
      customerName: selectedCust ? selectedCust.name : formData.customerName,
      documentName: formData.documentName,
      category: formData.category,
      receivedDate: formData.receivedDate,
      status: formData.status,
      remarks: formData.remarks,
    });

    setIsAddModalOpen(false);
    refreshDocuments();
  };

  // Open Edit Modal
  const handleOpenEditModal = (doc: DocumentRecord) => {
    setEditingDoc(doc);
    setFormData({
      customerId: doc.customerId,
      customerName: doc.customerName,
      documentName: doc.documentName,
      category: doc.category,
      receivedDate: doc.receivedDate,
      status: doc.status,
      remarks: doc.remarks || '',
    });
    setFormError('');
  };

  // Submit Edit Document
  const handleUpdateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!formData.documentName.trim()) {
      setFormError('Document name is required.');
      return;
    }

    documentService.updateDocument(editingDoc.id, {
      documentName: formData.documentName,
      category: formData.category,
      receivedDate: formData.receivedDate,
      status: formData.status,
      remarks: formData.remarks,
    });

    setEditingDoc(null);
    refreshDocuments();
    if (viewingDoc && viewingDoc.id === editingDoc.id) {
      setViewingDoc(documentService.getDocumentById(editingDoc.id));
    }
  };

  // Quick Status Advance
  const handleQuickStatusChange = (doc: DocumentRecord) => {
    let nextStatus: DocumentStatus = 'Under Review';
    if (doc.status === 'Received') nextStatus = 'Under Review';
    else if (doc.status === 'Under Review') nextStatus = 'Verified';
    else if (doc.status === 'Verified') nextStatus = 'Received';
    else if (doc.status === 'Pending') nextStatus = 'Received';
    else if (doc.status === 'Rejected') nextStatus = 'Under Review';

    documentService.updateDocumentStatus(doc.id, nextStatus);
    refreshDocuments();
    if (viewingDoc && viewingDoc.id === doc.id) {
      setViewingDoc(documentService.getDocumentById(doc.id));
    }
  };

  // Delete Document
  const handleDeleteDocument = (id: string) => {
    documentService.deleteDocument(id);
    setDeletingDocId(null);
    if (viewingDoc && viewingDoc.id === id) {
      setViewingDoc(null);
    }
    refreshDocuments();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedCustomerId('All');
    setSelectedCategory('All');
    setSelectedStatus('All');
  };

  // Helper for badge variant
  const getStatusBadgeVariant = (status: DocumentStatus) => {
    switch (status) {
      case 'Verified':
        return 'verified';
      case 'Under Review':
        return 'in-process';
      case 'Received':
        return 'neutral';
      case 'Pending':
        return 'pending';
      case 'Rejected':
        return 'rejected';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Document Management Repository"
        subtitle="Customer-wise document register for identity cards, bank letters, and consular submission dossiers"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAddModal}
          >
            Add Document Record
          </Button>
        }
      />

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by customer name, document name, or ID..."
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
          <div className="w-full md:w-44">
            <SelectInput
              options={[
                { value: 'All', label: 'All Categories' },
                ...DOCUMENT_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
              ]}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            />
          </div>
          <div className="w-full md:w-40">
            <SelectInput
              options={[
                { value: 'All', label: 'All Statuses' },
                ...DOCUMENT_STATUSES.map((st) => ({ value: st, label: st })),
              ]}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
          {(search ||
            selectedCustomerId !== 'All' ||
            selectedCategory !== 'All' ||
            selectedStatus !== 'All') && (
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

      {/* Document Listing or Empty State */}
      {isEmptyStateMode &&
      documents.length === 0 &&
      !search &&
      selectedCustomerId === 'All' &&
      selectedCategory === 'All' &&
      selectedStatus === 'All' ? (
        <EmptyState
          title="Document Repository Empty"
          description="No identity or financial verification files have been recorded in the consultancy register. Log your first client document metadata record."
          actionText="Add Document Record"
          onAction={handleOpenAddModal}
        />
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No matching documents found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or clearing customer and category filters.
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
            <table className="w-full min-w-[980px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5 whitespace-nowrap">Document ID</th>
                  <th className="px-4 py-3.5">Document Details</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Customer Name</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Category</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Received Date</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5">Remarks</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Last Updated</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap align-top">
                      <span className="font-mono font-medium text-slate-700">
                        {doc.id}
                      </span>
                    </td>

                    {/* Document Name */}
                    <td className="px-4 py-3.5 align-top max-w-xs">
                      <div className="flex items-center gap-2 font-semibold text-slate-900 leading-snug">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{doc.documentName}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3.5 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{doc.customerName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 pl-5">
                        {doc.customerId}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 align-top whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.category}
                      </span>
                    </td>

                    {/* Received Date */}
                    <td className="px-4 py-3.5 align-top whitespace-nowrap text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doc.receivedDate}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(doc.status)}>
                        {doc.status}
                      </Badge>
                    </td>

                    {/* Remarks */}
                    <td className="px-4 py-3.5 align-top max-w-xs text-slate-500">
                      <div className="line-clamp-2 leading-relaxed">
                        {doc.remarks || '—'}
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="px-4 py-3.5 align-top whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {doc.lastUpdated}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Quick Status toggle */}
                        <button
                          title="Advance Document Status"
                          onClick={() => handleQuickStatusChange(doc)}
                          className="px-2 py-1 text-[11px] font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {doc.status === 'Verified' ? 'Reset' : 'Verify'}
                        </button>

                        {/* View */}
                        <button
                          title="View Details"
                          onClick={() => setViewingDoc(doc)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          title="Edit Document"
                          onClick={() => handleOpenEditModal(doc)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          title="Delete Record"
                          onClick={() => setDeletingDocId(doc.id)}
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

      {/* Add Document Record Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Document Record"
        subtitle="Register customer verification metadata in the consultancy repository"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateDocument}>
              Save Document Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateDocument} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
            Note: This system logs and tracks document verification metadata.
          </div>

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
                setFormData({
                  ...formData,
                  customerId: id,
                  customerName: c ? c.name : '',
                });
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id}) {c.visaTrack ? `— ${c.visaTrack}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Document Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Valid Passport Original Bio Page or Bank Statement"
              value={formData.documentName}
              onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as DocumentCategory })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Received Date
              </label>
              <input
                type="date"
                required
                value={formData.receivedDate}
                onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as DocumentStatus })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                {DOCUMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Remarks</label>
            <textarea
              rows={3}
              placeholder="Record condition, validity, issuing authority, or verification remarks..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>
        </form>
      </Modal>

      {/* Edit Document Record Modal */}
      <Modal
        isOpen={!!editingDoc}
        onClose={() => setEditingDoc(null)}
        title={`Edit Document: ${editingDoc?.id}`}
        subtitle={`Modify metadata for ${editingDoc?.customerName}`}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingDoc(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateDocument}>
              Update Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateDocument} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Document Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.documentName}
              onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as DocumentCategory })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Received Date
              </label>
              <input
                type="date"
                required
                value={formData.receivedDate}
                onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as DocumentStatus })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                {DOCUMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Remarks</label>
            <textarea
              rows={3}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>
        </form>
      </Modal>

      {/* View Document Details Modal */}
      <Modal
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc ? `${viewingDoc.id} – ${viewingDoc.documentName}` : 'Document Details'}
        subtitle="Complete record of registered customer verification metadata"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                const id = viewingDoc?.id;
                if (id) setDeletingDocId(id);
              }}
            >
              Delete
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (viewingDoc) {
                    const d = viewingDoc;
                    setViewingDoc(null);
                    handleOpenEditModal(d);
                  }
                }}
              >
                Edit Record
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (viewingDoc) {
                    handleQuickStatusChange(viewingDoc);
                  }
                }}
              >
                {viewingDoc?.status === 'Verified' ? 'Reset Status' : 'Mark as Verified'}
              </Button>
            </div>
          </div>
        }
      >
        {viewingDoc && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Customer Name
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingDoc.customerName}
                </p>
                <span className="text-[10px] text-blue-600 font-mono">
                  {viewingDoc.customerId}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Category
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingDoc.category}
                </p>
                <span className="text-[10px] text-slate-500">Document Type</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Received Date
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingDoc.receivedDate}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Verification Status
                </span>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(viewingDoc.status)}>
                    {viewingDoc.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Remarks & Observations
              </div>
              <div className="text-slate-800 font-medium text-xs mt-1.5 leading-relaxed whitespace-pre-wrap">
                {viewingDoc.remarks || 'No remarks recorded for this document.'}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Last Updated: {viewingDoc.lastUpdated}</span>
              {viewingDoc.isDemo && (
                <span className="text-amber-600 font-medium">DEMO DATA</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingDocId}
        onClose={() => setDeletingDocId(null)}
        title="Confirm Document Record Deletion"
        subtitle="This action will remove the document metadata record."
        maxWidth="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingDocId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deletingDocId) handleDeleteDocument(deletingDocId);
              }}
            >
              Delete Record
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Are you sure you want to delete document record{' '}
          <strong className="text-slate-800">{deletingDocId}</strong>? This in-memory demo
          action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};
