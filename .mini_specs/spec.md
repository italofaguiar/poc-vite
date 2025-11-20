Analise os topicos abaixo, faça eventuais perguntas de esclarecimento e, após todas sanadas, construa `.mini_specs/tasks.md` com as tasks detalhadas para cada etapa do plano. 

Deve ser um documento markdown separado por Fases e em cada fase deve haver um checklist de tasks a serem realizadas. A medida que as tasks forem sendo concluídas, iremos marcando como feitas.

Por fim, uma vez aprovadas as tasks, iremos executar as tasks para construir a poc.

Obs: adicione algo nessa linha no inicio de tasks.md:
```
**CRÍTICO**: Siga o seguinte ciclo para cada fase:
> implemente uma fase → testa "manual" → commita → atualiza tasks.md
obs: Inclusive, se necessário, pode fazer testes em passos intermediários dentro da propria fase. 
```

---

- [x] habilitar o login via Google (OAuth2) no frontend
- [ ] test all local, deploy e testar remoto!
- [ ] gh actions com tests+deploy.. JA FAZ O PR
- [ ] botao google embaixo, nao?
- [ ] garantir que cada novo /me com sucesso prolonga a sessao atual (se existir). obviamente, se passar muito tempo, a sessao expira e o usuario precisa logar de novo
- [ ] resolver testes intermitentes do frontend


- [ ] migrar para Mapped em vez de usar Column  
- [ ] precisava msm o secret ser gerado no terraform com toda aquela complicacao? nao poderia ser um random value no codigo?
- [ ] Entender melhor como ta sendo usado o session_id (cripto, db, etc)

