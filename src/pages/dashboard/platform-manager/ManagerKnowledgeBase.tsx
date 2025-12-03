import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, FileText, ChevronRight,
  Clock, User, Tag, ExternalLink, BookOpen, CheckSquare, Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { platformManagerAPI } from '../../../api';

// Icon mapping for categories
const iconMap: Record<string, any> = {
  User,
  FileText,
  Tag,
  ExternalLink,
};

export function ManagerKnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('docs');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch categories
  const { data: documentationCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['platform-manager', 'knowledge-base', 'categories'],
    queryFn: platformManagerAPI.getKnowledgeBaseCategories,
  });

  // Fetch articles
  const { data: documentationArticles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['platform-manager', 'knowledge-base', 'articles', selectedCategory, searchTerm],
    queryFn: () => platformManagerAPI.getKnowledgeBaseArticles({
      category: selectedCategory || undefined,
      search: searchTerm || undefined
    }),
  });

  // Fetch procedures
  const { data: procedures = [], isLoading: proceduresLoading } = useQuery({
    queryKey: ['platform-manager', 'knowledge-base', 'procedures'],
    queryFn: platformManagerAPI.getProcedures,
  });

  // Fetch checklists
  const { data: checklists = [], isLoading: checklistsLoading } = useQuery({
    queryKey: ['platform-manager', 'knowledge-base', 'checklists'],
    queryFn: platformManagerAPI.getChecklists,
  });

  const filteredArticles = documentationArticles.filter((article: any) => {
    const matchesSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isLoading = categoriesLoading || articlesLoading || proceduresLoading || checklistsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Base de Conhecimento</h1>
        <p className="text-muted-foreground">Documentação interna, procedimentos e checklists</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar na base de conhecimento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="docs">
            <BookOpen className="w-4 h-4 mr-2" />
            Documentação
          </TabsTrigger>
          <TabsTrigger value="procedures">
            <FileText className="w-4 h-4 mr-2" />
            Procedimentos
          </TabsTrigger>
          <TabsTrigger value="checklists">
            <CheckSquare className="w-4 h-4 mr-2" />
            Checklists
          </TabsTrigger>
        </TabsList>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="space-y-4 mt-4">
          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {documentationCategories.map((category: any) => {
              const IconComponent = iconMap[category.icon] || FileText;
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    selectedCategory === category.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.name ? null : category.name
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        category.color === 'blue' ? 'bg-blue-100' :
                        category.color === 'green' ? 'bg-green-100' :
                        category.color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          category.color === 'blue' ? 'text-blue-600' :
                          category.color === 'green' ? 'text-green-600' :
                          category.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">{category.articles} artigos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Articles List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedCategory ? `Artigos: ${selectedCategory}` : 'Todos os Artigos'}
              </CardTitle>
              <CardDescription>{filteredArticles.length} artigos encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredArticles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum artigo encontrado</p>
                ) : (
                  filteredArticles.map((article: any) => (
                    <div
                      key={article.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{article.title}</h4>
                            <Badge variant="outline">{article.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {article.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {article.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {article.updatedAt}
                            </span>
                            <span>{article.views} visualizações</span>
                          </div>
                          <div className="flex gap-1 mt-2">
                            {article.tags?.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Procedures Tab */}
        <TabsContent value="procedures" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Procedimentos e Diretrizes</CardTitle>
              <CardDescription>Processos padronizados da equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {procedures.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum procedimento encontrado</p>
                ) : (
                  procedures.map((procedure: any) => (
                    <div key={procedure.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-lg">{procedure.title}</h4>
                        <span className="text-sm text-muted-foreground">
                          Atualizado: {procedure.lastUpdated}
                        </span>
                      </div>
                      <ol className="list-decimal list-inside space-y-2">
                        {procedure.steps?.map((step: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklists Tab */}
        <TabsContent value="checklists" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Checklists de Plataforma</CardTitle>
              <CardDescription>Listas de verificação para processos críticos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checklists.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 col-span-full">Nenhum checklist encontrado</p>
                ) : (
                  checklists.map((checklist: any) => (
                    <Card key={checklist.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{checklist.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {checklist.items?.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                item.required ? 'border-red-300' : 'border-gray-300'
                              }`}>
                                {item.required && (
                                  <span className="text-red-500 text-xs">*</span>
                                )}
                              </div>
                              <span className="text-sm">{item.text}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground">
                            * Itens obrigatórios
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
