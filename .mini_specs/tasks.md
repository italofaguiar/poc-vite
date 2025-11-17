# Tasks - POC PilotoDeVendas.IA

Roadmap detalhado para implementação das melhorias na POC. As tasks estão organizadas em fases sequenciais.

---

## 📦 Fase 1: Migração para UV + pyproject.toml

**Objetivo**: Modernizar o gerenciamento de dependências do backend Python usando UV e pyproject.toml.

### Tasks

- [ ] **1.1** Criar `pyproject.toml` na raiz do backend
  - Definir metadata do projeto (name, version, description)
  - Migrar dependências de `requirements.txt` para `dependencies`
  - Configurar `dev-dependencies` (pytest, ruff, mypy, etc.)
  - Adicionar configurações do ruff, mypy, pytest no pyproject.toml

- [ ] **1.2** Atualizar `Dockerfile` do backend para usar UV
  - Instalar UV no container
  - Ajustar comando de instalação: `uv pip install --no-cache` → `uv sync`
  - Otimizar layers do Docker (cache de dependências)

- [ ] **1.3** Atualizar `docker-compose.yml`
  - Ajustar volumes se necessário
  - Garantir que hot-reload continue funcionando

- [ ] **1.4** Criar script de migração local
  - Documentar como desenvolvedores devem migrar ambiente local
  - Criar `scripts/setup-backend.sh` para automação

- [ ] **1.5** Atualizar documentação
  - Atualizar `CLAUDE.md` com novos comandos UV
  - Atualizar `README.md` se necessário
  - Adicionar seção sobre UV no guia de desenvolvimento

- [ ] **1.6** Testar ambiente completo
  - Validar que `docker compose up --build` funciona
  - Validar que backend inicia sem erros
  - Validar que endpoints da API funcionam
  - Validar que linting (ruff + mypy) funciona

- [ ] **1.7** Remover `requirements.txt`
  - Remover arquivo completamente após confirmar que tudo funciona com UV
  - Atualizar `.gitignore` se necessário

---

## 🎨 Fase 2: Sistema de Dark Mode

**Objetivo**: Implementar toggle de dark/light mode com default dark e tema verde/preto inspirado no pvia-lp.

### Design System

**Cores Dark Mode (default)**:
- Background: `#0a0a0a` (preto principal), `#111111` (preto secundário)
- Primary: `#00ff88` (verde brilhante), `#00cc6a` (verde escuro)
- Text: `#ffffff` (branco), `#b3b3b3` (cinza claro)
- Borders: `rgba(0, 255, 136, 0.1)` (verde translúcido)

**Cores Light Mode**:
- Background: `#ffffff` (branco), `#f5f5f5` (cinza claro)
- Primary: `#00cc6a` (verde escuro), `#00a855` (verde mais escuro)
- Text: `#0a0a0a` (preto), `#666666` (cinza escuro)
- Borders: `rgba(0, 204, 106, 0.2)` (verde translúcido)

### Tasks

- [ ] **2.1** Setup Tailwind CSS com tema customizado
  - Configurar `tailwind.config.js` com cores personalizadas
  - Adicionar configuração de dark mode: `darkMode: 'class'`
  - Definir paleta de cores (dark/light) no tema
  - Testar que Tailwind está compilando corretamente

- [ ] **2.2** Criar contexto de tema (`ThemeContext`)
  - Criar `frontend/src/contexts/ThemeContext.tsx`
  - Implementar `ThemeProvider` com estado (dark/light)
  - Implementar persistência em `localStorage` (key: `theme`)
  - Detectar preferência do sistema na primeira visita
  - Aplicar classe `dark` no elemento `<html>` quando dark mode ativo

- [ ] **2.3** Criar componente `ThemeToggle`
  - Botão com ícone de sol/lua (ou outro design)
  - Animação suave na transição (fade/slide)
  - Acessível (aria-label, keyboard navigation)
  - Estilizado com cores do design system

- [ ] **2.4** Integrar tema no layout principal
  - Adicionar `ThemeProvider` no `App.tsx`
  - Adicionar `ThemeToggle` **apenas no Dashboard** (não no header global)
  - Posicionar toggle em local acessível (ex: canto superior direito do dashboard)

- [ ] **2.5** Migrar estilos das páginas para suportar dark/light
  - **Login.tsx**: Aplicar classes Tailwind dark/light
  - **Signup.tsx**: Aplicar classes Tailwind dark/light
  - **Dashboard.tsx**: Aplicar classes Tailwind dark/light
  - Backgrounds, cards, inputs, buttons

- [ ] **2.6** Migrar estilos dos componentes
  - **ProtectedRoute**: (apenas se tiver estilos inline)
  - **Chart.tsx**: Atualizar cores dos gráficos (Recharts theme)
  - **Table.tsx**: Headers, rows, borders
  - **ErrorMessage**: Background, borda, texto

- [ ] **2.7** Aplicar design inspirado em pvia-lp
  - Gradientes no botão primary: `linear-gradient(135deg, #00ff88, #00cc6a)`
  - Efeito de glow/shadow nos botões (hover)
  - Backdrop blur no header (se aplicável)
  - Animações suaves (transitions, pulse effect)

- [ ] **2.8** Testar acessibilidade e contraste
  - Validar contraste de cores (WCAG AA mínimo)
  - Testar navegação por teclado
  - Testar em diferentes navegadores

- [ ] **2.9** Documentar sistema de cores
  - Criar `docs/design-system.md` ou adicionar no README
  - Documentar paleta de cores, uso de classes Tailwind
  - Exemplos de componentes

---

## 🌍 Fase 3: Sistema de Internacionalização (i18n)

**Objetivo**: Adicionar suporte a múltiplos idiomas (português e inglês) no frontend.

### Tasks

- [ ] **3.1** Instalar e configurar react-i18next
  - `npm install react-i18next i18next i18next-browser-languagedetector`
  - Criar `frontend/src/i18n/index.ts` com configuração
  - Configurar `LanguageDetector` (localStorage + navigator.language)
  - Definir `fallbackLng: 'pt'` (português como padrão)

- [ ] **3.2** Criar arquivos de tradução
  - Criar `frontend/src/i18n/locales/pt.json` (português)
  - Criar `frontend/src/i18n/locales/en.json` (inglês)
  - Estruturar JSON por namespaces: `auth`, `dashboard`, `common`, `errors`

- [ ] **3.3** Traduzir strings - Autenticação
  - Login: labels, placeholders, botões, mensagens de erro
  - Signup: labels, placeholders, botões, mensagens de erro
  - Logout, sessão expirada

- [ ] **3.4** Traduzir strings - Dashboard
  - Títulos de seções
  - Labels de métricas (vendas, leads, conversão)
  - Tooltips, botões de ação

- [ ] **3.5** Traduzir strings - Componentes comuns
  - ErrorMessage: mensagens genéricas
  - Loading states
  - Validações de formulário (Zod)
  - Documentação/help text (se existir)

- [ ] **3.6** Traduzir mensagens de erro da API
  - Backend retorna erros em inglês técnico
  - Criar mapeamento de códigos de erro → mensagens i18n
  - Atualizar `getErrorMessage()` helper em `types/index.ts`

- [ ] **3.7** Criar componente `LanguageToggle`
  - Dropdown ou botão com bandeiras/siglas (PT/EN)
  - Persistir escolha no `localStorage` (key: `language`)
  - Atualizar `i18n.changeLanguage()` ao trocar
  - Posicionar **apenas no Dashboard** (próximo ao ThemeToggle)

- [ ] **3.8** Integrar i18n no app
  - Importar i18n config no `main.tsx`
  - Adicionar `LanguageToggle` **apenas no Dashboard**
  - Garantir que idioma persiste entre reloads

- [ ] **3.9** Atualizar testes
  - Mockar i18n nos testes de componentes (Vitest)
  - Validar que componentes renderizam com traduções
  - Testar troca de idioma (se aplicável)

- [ ] **3.10** Documentar uso do i18n
  - Atualizar `CLAUDE.md` com instruções
  - Como adicionar novas traduções
  - Como usar `useTranslation()` hook

---

## 🧪 Fase 4: Integração e Testes

**Objetivo**: Garantir que todas as features funcionam juntas e passar por testes manuais/automatizados.

### Tasks

- [ ] **4.1** Testes manuais - Fluxo completo
  - Signup → Login → Dashboard (ambos idiomas, ambos temas)
  - Verificar que tema e idioma persistem após reload
  - Testar logout e re-login
  - Testar em diferentes navegadores (Chrome, Firefox, Safari)

- [ ] **4.2** Testes automatizados - Dark mode
  - Adicionar testes no Vitest para `ThemeContext`
  - Verificar persistência em `localStorage`
  - Verificar aplicação de classe `dark` no HTML

- [ ] **4.3** Testes automatizados - i18n
  - Adicionar testes para troca de idioma
  - Verificar persistência em `localStorage`
  - Verificar que componentes renderizam traduções corretas

- [ ] **4.4** Testes E2E com Playwright (opcional)
  - Criar teste E2E: signup → login → toggle tema → toggle idioma → logout
  - Validar elementos visuais (screenshots diff em dark/light)

- [ ] **4.5** Validar linting e build
  - `docker compose exec frontend npm run lint` (0 erros)
  - `docker compose exec frontend npm run build` (sucesso)
  - `docker compose exec backend sh /app/lint.sh` (sucesso)

- [ ] **4.6** Testar acessibilidade
  - Executar Lighthouse audit (acessibilidade ≥ 90)
  - Testar navegação por teclado em todos os fluxos
  - Testar com leitor de tela (NVDA/VoiceOver) - básico

- [ ] **4.7** Revisar performance
  - Verificar tempo de carregamento inicial
  - Verificar bundle size (não deve aumentar significativamente)
  - Otimizar se necessário (code splitting, lazy loading)

---

## 📝 Fase 5: Documentação e Finalização

**Objetivo**: Atualizar toda a documentação e preparar para próximas etapas.

### Tasks

- [ ] **5.1** Atualizar `CLAUDE.md`
  - Adicionar seção sobre UV + pyproject.toml
  - Adicionar seção sobre Dark Mode (sistema de cores, ThemeContext)
  - Adicionar seção sobre i18n (estrutura, como adicionar traduções)
  - Atualizar comandos de desenvolvimento se necessário

- [ ] **5.2** Atualizar `README.md`
  - Screenshots com novo visual (dark/light mode)
  - Atualizar features: "🎨 Dark/Light mode" + "🌍 i18n (PT/EN)"
  - Atualizar instruções de setup (UV)

- [ ] **5.3** Criar `docs/design-system.md` (se não existir)
  - Documentar paleta de cores
  - Documentar componentes de tema
  - Exemplos de uso do Tailwind

- [ ] **5.4** Criar `docs/i18n.md` (se necessário)
  - Como adicionar novos idiomas
  - Como adicionar novas traduções
  - Estrutura dos arquivos JSON

- [ ] **5.5** Atualizar `.env.example` (se necessário)
  - Adicionar variáveis relacionadas ao tema/idioma (se houver)

- [ ] **5.6** Criar CHANGELOG ou release notes
  - Documentar mudanças principais
  - Versão da POC (ex: v0.2.0)

- [ ] **5.7** Commit final e tag
  - Criar commit com mensagem descritiva
  - Criar tag git: `git tag v0.2.0-dark-mode-i18n`
  - Push com tags: `git push origin main --tags`

---

## 📊 Resumo de Progresso

- **Fase 1 - UV + pyproject.toml**: 0/7 tasks
- **Fase 2 - Dark Mode**: 0/9 tasks
- **Fase 3 - i18n**: 0/10 tasks
- **Fase 4 - Testes e Integração**: 0/7 tasks
- **Fase 5 - Documentação**: 0/7 tasks

**Total**: 0/40 tasks concluídas

---

## 🎯 Notas Importantes

1. **Ordem de execução**: As fases devem ser executadas sequencialmente (1 → 2 → 3 → 4 → 5).
2. **Testes contínuos**: Ao finalizar cada fase, validar que nada quebrou antes de prosseguir.
3. **KISS**: Manter soluções simples. Evitar over-engineering.
4. **Commits frequentes**: Commitar ao final de cada task ou sub-fase.
5. **Linting obrigatório**: Sempre rodar linting antes de commitar.

## 🚀 Próximos Passos (após conclusão)

Após concluir as 5 fases, a POC estará com:
- ✅ Gerenciamento moderno de dependências (UV)
- ✅ Interface moderna com dark/light mode (verde/preto)
- ✅ Suporte a múltiplos idiomas (PT/EN)

Possíveis próximas features:
- Integração com WhatsApp (core do produto)
- Painel de analytics avançado
- Sistema de notificações
- Testes backend (pytest)
- CI/CD pipeline
