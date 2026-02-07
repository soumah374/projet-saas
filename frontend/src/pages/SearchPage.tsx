import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { projectApi, clientsAPI, teamsAPI, contratsAPI } from '@/lib/api'
import { Search } from 'lucide-react'

export const SearchPage: React.FC = () => {
  const [params, setParams] = useSearchParams()
  const initialQ = params.get('q') || ''
  const [query, setQuery] = useState(initialQ)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{
    projects: any[]
    clients: any[]
    teams: any[]
    contrats: any[]
  }>({ projects: [], clients: [], teams: [], contrats: [] })

  const q = useMemo(() => (params.get('q') || '').trim(), [params])

  const performSearch = async (search: string) => {
    if (!search) {
      setResults({ projects: [], clients: [], teams: [], contrats: [] })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [projectsRes, clientsRes, teamsRes, contratsRes] = await Promise.all([
        projectApi.getProjects({ search, page: 1 }),
        clientsAPI.getClients({ search, page: 1 }),
        teamsAPI.getTeams({ search, page: 1 }),
        contratsAPI.getContrats({search,page: 1})
      ])
      setResults({
        projects: projectsRes.data?.results || [],
        clients: clientsRes.data?.results || [],
        teams: (teamsRes.data?.results as any[]) || [],
        contrats: (contratsRes.data?.results as any[]) || []
      })
    } catch (e: any) {
      setError(e?.message || 'Erreur de recherche')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setQuery(q)
    performSearch(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      if (query) p.set('q', query)
      else p.delete('q')
      return p
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un projet, client, équipe..."
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>Rechercher</Button>
          </form>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projets ({results.projects.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <div className="text-sm text-gray-500">Chargement...</div>}
            {!loading && results.projects.length === 0 && <div className="text-sm text-gray-500">Aucun projet</div>}
            {results.projects.slice(0, 10).map((p: any) => (
              <div key={p.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 truncate max-w-[360px]">{p.title}</div>
                  <div className="text-xs text-gray-500">{p.status} • {p.id}</div>
                </div>
                <Link to={`/projects/${p.id}`} className="text-primary text-sm">Ouvrir</Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clients ({results.clients.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <div className="text-sm text-gray-500">Chargement...</div>}
            {!loading && results.clients.length === 0 && <div className="text-sm text-gray-500">Aucun client</div>}
            {results.clients.slice(0, 10).map((c: any) => (
              <div key={c.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 truncate max-w-[360px]">{c.nom_complet || c.raison_sociale || 'Client'}</div>
                  <div className="text-xs text-gray-500">{c.email}</div>
                </div>
                <Link to={`/clients`} className="text-primary text-sm">Voir</Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Équipes ({results.teams.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <div className="text-sm text-gray-500">Chargement...</div>}
            {!loading && results.teams.length === 0 && <div className="text-sm text-gray-500">Aucune équipe</div>}
            {results.teams.slice(0, 10).map((t: any) => (
              <div key={t.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 truncate max-w-[360px]">{t.name}</div>
                  <div className="text-xs text-gray-500">Membres: {t.members_count ?? '—'}</div>
                </div>
                <Link to={`/teams`} className="text-primary text-sm">Voir</Link>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contrats ({results.contrats.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <div className="text-sm text-gray-500">Chargement...</div>}
            {!loading && results.contrats.length === 0 && <div className="text-sm text-gray-500">Aucun contrat</div>}
            {results.contrats.slice(0, 10).map((c: any) => (
              <div key={c.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 truncate max-w-[360px]">{c.numero}</div>
                  <div className="text-xs text-gray-500">{c.client.nom_complet || c.client.raison_sociale || 'Client'}</div>
                </div>
                <Link to={`/contrats/${c.id}`} className="text-primary text-sm">Ouvrir</Link>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SearchPage 