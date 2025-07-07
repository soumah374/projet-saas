import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface UpdateBudgetModalProps {
  children: React.ReactNode;
  projectId: string;
  currentBudget: {
    total: string;
    details: {
      production: string;
      personnel: string;
      marketing: string;
      other: string;
    };
  };
  onBudgetUpdate: (projectId: string, budgetData: any) => Promise<void>;
}

export const UpdateBudgetModal = ({ children, projectId, currentBudget, onBudgetUpdate }: UpdateBudgetModalProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    budget: currentBudget.total,
    budgetDetails: {
      production: currentBudget.details.production,
      personnel: currentBudget.details.personnel,
      marketing: currentBudget.details.marketing,
      other: currentBudget.details.other
    }
  });

  const calculateTotalBudget = () => {
    const total = Object.values(formData.budgetDetails).reduce((sum, value) => {
      return sum + (parseFloat(value) || 0);
    }, 0);
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalBudget = formData.budget ? parseFloat(formData.budget) : calculateTotalBudget();
    
    try {
      await onBudgetUpdate(projectId, {
        budget: totalBudget.toString(),
        budget_details: {
          production: (parseFloat(formData.budgetDetails.production) || 0).toString(),
          personnel: (parseFloat(formData.budgetDetails.personnel) || 0).toString(),
          marketing: (parseFloat(formData.budgetDetails.marketing) || 0).toString(),
          other: (parseFloat(formData.budgetDetails.other) || 0).toString(),
        }
      });
      setOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du budget:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Mise à jour du budget
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="budget">Budget total (GNF)</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              placeholder="0"
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="production">Production (GNF)</Label>
                <Input
                  id="production"
                  type="number"
                  value={formData.budgetDetails.production}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    budgetDetails: { ...prev.budgetDetails, production: e.target.value }
                  }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="personnel">Personnel (GNF)</Label>
                <Input
                  id="personnel"
                  type="number"
                  value={formData.budgetDetails.personnel}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    budgetDetails: { ...prev.budgetDetails, personnel: e.target.value }
                  }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="marketing">Marketing (GNF)</Label>
                <Input
                  id="marketing"
                  type="number"
                  value={formData.budgetDetails.marketing}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    budgetDetails: { ...prev.budgetDetails, marketing: e.target.value }
                  }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="other">Autres (GNF)</Label>
                <Input
                  id="other"
                  type="number"
                  value={formData.budgetDetails.other}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    budgetDetails: { ...prev.budgetDetails, other: e.target.value }
                  }))}
                  placeholder="0"
                />
              </div>
            </div>

            {calculateTotalBudget() > 0 && (
              <Card className="p-3 bg-blue-50">
                <p className="text-sm text-blue-700">
                  <strong>Total calculé: {calculateTotalBudget().toLocaleString()} GNF</strong>
                </p>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Mettre à jour
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 