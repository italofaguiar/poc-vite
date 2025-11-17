# Fase 2.10: Identidade Visual da Aplicação

**Objetivo**: Trazer a identidade visual forte do site https://pilotodevendas.com.br/ para as telas da POC.

---

## 🎨 Referência de Branding

**Logo**: "PilotoDeVendas.IA" em verde-neon (#00ff88)
**Tagline**: "Seu Vendedor de IA 24/7 no WhatsApp"
**Copy**: "Qualifique leads, conduza vendas e aumente sua conversão com inteligência artificial"
**Efeito visual**: Pulso radial animado de fundo (4s loop) com gradiente circular verde

---

## 📋 Tasks

### **2.10.1** Criar componente de Logo
- [ ] Criar `frontend/src/components/Logo.tsx`
- [ ] Versão completa: "PilotoDeVendas.IA" com ícone (se houver)
- [ ] Versão compacta: Apenas "PilotoDeVendas" ou ícone para mobile
- [ ] Props: `variant?: 'full' | 'compact'`, `size?: 'sm' | 'md' | 'lg'`
- [ ] Estilizado em verde-neon (#00ff88) com tipografia Inter/Sans-serif moderna

### **2.10.2** Criar efeito de fundo animado (Pulse Radial)
- [ ] Criar `frontend/src/components/AnimatedBackground.tsx`
- [ ] Implementar gradiente radial circular (verde-neon com transparência)
- [ ] Animação de pulso: 4s duration, infinite loop, ease-in-out
- [ ] Keyframes CSS: scale de 100% → 120% → 100%
- [ ] Opacidade variável: 0.3 → 0.5 → 0.3
- [ ] Position absolute, z-index baixo para ficar atrás do conteúdo

### **2.10.3** Redesenhar página de Login com Hero Section
- [ ] Estrutura em duas colunas (desktop) / stacked (mobile):
  - **Coluna esquerda (50%)**: Hero section com branding
  - **Coluna direita (50%)**: Formulário de login
- [ ] **Hero Section** (coluna esquerda):
  - `<AnimatedBackground />` como fundo
  - Logo grande (variant='full', size='lg')
  - Tagline: "Seu Vendedor de IA 24/7 no WhatsApp"
  - Copy descritivo (2-3 linhas)
  - Tipografia: Headline 48-64px, Body 18-20px
  - Centralizado verticalmente
- [ ] **Formulário** (coluna direita):
  - Manter estrutura atual (email, senha, botão)
  - Card com fundo dark/light adaptável
  - Título simplificado: "Fazer login"
- [ ] **Responsivo**:
  - Desktop: Two columns side-by-side
  - Tablet/Mobile: Hero section compacta no topo + form abaixo

### **2.10.4** Redesenhar página de Signup com Hero Section
- [ ] Aplicar mesmo layout de duas colunas do Login
- [ ] **Hero Section**: Idêntica ao Login (reutilizar componente)
- [ ] **Formulário**:
  - Título: "Criar nova conta"
  - Manter campos atuais (email, senha)
  - Link para login
- [ ] **Responsivo**: Mesmo comportamento do Login

### **2.10.5** Adicionar Logo no Dashboard Header
- [ ] Remover/simplificar hero elements do Dashboard (já tem toggle + logout)
- [ ] Adicionar `<Logo variant="compact" size="md" />` no header
- [ ] Posição: Alinhado à esquerda (antes do título "Dashboard")
- [ ] Layout: `Logo | Dashboard | (user_email) | [ThemeToggle] [Sair]`
- [ ] Responsivo: Logo sempre visível, texto "Dashboard" pode ser oculto em mobile

### **2.10.6** Criar componente Hero Section reutilizável
- [ ] Criar `frontend/src/components/HeroSection.tsx`
- [ ] Props:
  - `title: string` (ex: tagline)
  - `subtitle?: string` (ex: copy descritivo)
  - `showAnimation?: boolean` (default: true)
- [ ] Estrutura:
  - Background: `<AnimatedBackground />` (se showAnimation=true)
  - Content: Logo + Title + Subtitle centralizados
  - Padding: 180px top em desktop, 80px em mobile
- [ ] Tipografia responsiva (64px → 40px em mobile)

### **2.10.7** Atualizar cores e tipografia global
- [ ] Verificar se tipografia Inter está importada no projeto
  - Se não: adicionar Google Fonts no `index.html` ou instalar via npm
- [ ] Adicionar Inter como font-family padrão no `tailwind.config.js`
- [ ] Atualizar classes utilitárias:
  - `.text-brand`: cor verde-neon (#00ff88)
  - `.font-headline`: Inter, peso 600-700
  - `.font-body`: Inter, peso 400

### **2.10.8** Testar identidade visual em dark/light mode
- [ ] Validar que logo fica visível em ambos os temas
- [ ] Ajustar opacidade do AnimatedBackground se necessário
- [ ] Garantir contraste adequado (WCAG AA) em hero text
- [ ] Testar responsividade em diferentes resoluções:
  - Desktop (1920x1080)
  - Tablet (768x1024)
  - Mobile (375x667)

### **2.10.9** Documentar componentes de branding
- [ ] Atualizar `CLAUDE.md` com seção "Branding e Identidade Visual"
- [ ] Documentar uso dos novos componentes:
  - `<Logo />` com exemplos
  - `<HeroSection />` com exemplos
  - `<AnimatedBackground />` como elemento standalone
- [ ] Adicionar guidelines de uso (quando usar hero, quando usar logo simples)

---

## 🎯 Resultado Esperado

**Login/Signup**:
- Visual impactante com hero section forte
- Branding consistente com site principal (pilotodevendas.com.br)
- Efeito de pulso radial animado criando movimento e dinamismo
- Layout em duas colunas (desktop) que separa branding de formulário

**Dashboard**:
- Logo discreto no header (alinhado à esquerda)
- Sem distrações visuais, foco na funcionalidade
- Mantém identidade visual sem comprometer usabilidade

**Mobile**:
- Hero section compacta mas presente
- Logo sempre visível
- Layout responsivo que prioriza conteúdo

---

## 📊 Progresso

- **Total de subtasks**: 0/38
