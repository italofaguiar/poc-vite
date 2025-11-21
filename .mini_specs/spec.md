Analise os topicos abaixo, faça eventuais perguntas de esclarecimento e, após todas sanadas, construa `.mini_specs/tasks.md` com as tasks detalhadas para cada etapa do plano. 

Deve ser um documento markdown separado por Fases e em cada fase deve haver um checklist de tasks a serem realizadas. A medida que as tasks forem sendo concluídas, iremos marcando como feitas.

Por fim, uma vez aprovadas as tasks, iremos executar as tasks para construir a poc.

Obs: adicione algo nessa linha no inicio de tasks.md:
```
**CRÍTICO**: Siga o seguinte ciclo para cada fase:
> implemente uma fase → testa "manual" → commita → atualiza tasks.md
obs: Inclusive, se necessário, pode fazer testes em passos intermediários dentro da propria fase. 
```

Pode sobre escrever o arquivo tasks.md sem problema. Só garanta que ele está em UTF-8 e você vai escrever em UTF-8.

---


- [ ] preparar o projeto para usar o padrao consadrado de CI/CD para usar git hub actions para build, test e deploy automatico no cloud run. 
- [ ] Naturalmente, para isso eu quero que não aconteça o merge caso de algum problema no teste. 
- [ ] Me ajude também a configurar a questão do permissionamento do GitHub Actions lá no meu GCP no meu Cloud Run. 
- [ ] quero que, na etapa teste, rode os tests equivalente ao 'make test' (unitários backend + frontend)

---

- [ ] quero que, na etapa teste, rode os tests equivalente ao 'make test-all' (Atente que aqui ele roda os testes E2E e para isso precisa além do playwright, que já está no package.json do front-end, também das dependências do playwright de alguma forma em relação ao Chrome. Ou Chrome não sei o ideal era padronizar isso tanto aqui no projeto como o que vai acontecer lá no CICD. )
- [ ] botao google embaixo, nao?

---

FUTURO


- [ ] garantir que cada novo /me com sucesso prolonga a sessao atual (se existir). obviamente, se passar muito tempo, a sessao expira e o usuario precisa logar de novo
- [ ] resolver testes intermitentes do frontend


