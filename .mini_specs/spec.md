Analise os topicos abaixo, faça eventuais perguntas de esclarecimento e, após todas sanadas, construa `.mini_specs/tasks.md` com as tasks detalhadas para cada etapa do plano. 

Deve ser um documento markdown separado por Fases e em cada fase deve haver um checklist de tasks a serem realizadas. A medida que as tasks forem sendo concluídas, iremos marcando como feitas.

Por fim, uma vez aprovadas as tasks, iremos executar as tasks para construir a poc.

---
esclareimentos

  1. UV + pyproject.toml:
  - Should we migrate the entire backend dependency management to uv and pyproject.toml? yes
  - Do you want to keep Docker setup working with the new approach, or focus on local development first? keep docker working
  - Should we remove requirements.txt entirely or keep it for backward compatibility? remove

  2. Dark Mode Toggle:
  - Do you want the dark/light mode preference to be:
    - Stored only in browser (localStorage)? yes
    - User preference saved in database (requires backend changes)? no
  - Should the toggle be accessible from all pages or just dashboard? dashboard
  - Let me check the reference project /home/italo/projects/pvia-lp to understand the design inspiration better. -> ok

  3. Multi-language (i18n):
  - Which library do you prefer: react-i18next (most popular) or react-intl (Formatjs)? I don't mind, make the best choice
  - Should language preference be:
    - Browser-based only (localStorage + browser language detection)? yes
    - User profile setting (saved in database)? no
  - Do you want to translate:
    - UI strings (buttons, labels)? yes
    - Error messages from backend too? yes
    - Documentation/help text? yes (but I dont know if they exist yet)


---

tasks to create

- [ ] uv+pyproject.toml para o backend python
- [ ] Dark mode toggle no frontend (default dark)
    - tematica principal: use cores principais preto e verde (layout moderno, tipo spotify ou supabase)
    - puxa inspiracao do proj /home/italo/projects/pvia-lp
- [ ] suporte multi-linguagem no frontend (por ora, só português e inglês)


--- 

- Fazer tanto na tela inicial como no dashboard uma identidade basica da app. observe https://pilotodevendas.com.br/ e veja a hero section. traga ela bem forte para as telas de login/signup. ja no dashboard deixe apenas o logo no header, alinhado a esquerda.
