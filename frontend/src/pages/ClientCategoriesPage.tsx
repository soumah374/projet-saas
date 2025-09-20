import React, { useEffect, useState, useMemo } from 'react';
import { clientCategoriesAPI } from '@/lib/api';
import type { ClientCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Edit, Search, X } from 'lucide-react';
import { CanManage } from '@/components/PermissionGuard';
import { usePermissions } from '@/hooks/use-permissions';

export default function ClientCategoriesPage() {
  const [categories, setCategories] = useState<ClientCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<{ id?: number; name: string; description: string }>({ name: '', description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { 
    hasPermission
  } = usePermissions();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await clientCategoriesAPI.getCategories();
      setCategories(res.data && Array.isArray(res.data.results) ? res.data.results : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await clientCategoriesAPI.updateCategory(editingId, { name: form.name, description: form.description });
      } else {
        await clientCategoriesAPI.createCategory({ name: form.name, description: form.description });
      }
      setForm({ name: '', description: '' });
      setEditingId(null);
      setModalOpen(false);
      fetchCategories();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: ClientCategory) => {
    setForm({ name: cat.name, description: cat.description });
    setEditingId(cat.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    await clientCategoriesAPI.deleteCategory(id);
    fetchCategories();
  };

  const openCreateModal = () => {
    setForm({ name: '', description: '' });
    setEditingId(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({ name: '', description: '' });
    setEditingId(null);
  };

  // Filtrer les catégories basé sur le terme de recherche
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories;
    }
    
    const term = searchTerm.toLowerCase().trim();
    return categories.filter(category => 
      category.name.toLowerCase().includes(term) ||
      category.description.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="max-w-8xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Catégories de clients</CardTitle>
            {hasPermission('users.add_clientcategory') && (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une catégorie
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher par nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                >
                  <X size={14} />
                </Button>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-2">
                {filteredCategories.length} résultat(s) trouvé(s) pour "{searchTerm}"
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'Aucune catégorie trouvée pour cette recherche' : 'Aucune catégorie disponible'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="max-w-md truncate">{cat.description}</TableCell>
                      <TableCell>
                        {hasPermission('users.change_clientcategory') && (
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(cat)}><Edit size={16} /></Button>
                        )}
                        {hasPermission('users.delete_clientcategory') && (
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(cat.id)}><Trash2 size={16} /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal d'édition/création */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom de la catégorie</label>
              <Input
                name="name"
                placeholder="Nom de la catégorie"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : editingId ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 