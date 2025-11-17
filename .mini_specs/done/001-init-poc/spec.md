Analise o arquivo `docs/1.contexto.md` bem como `docs/chats/*` para entender as definições feitas. 

Elabora um plano em `.mini_specs/plan.md` para comecarmos a implementar uma poc usando python como backend (api+bff) e vite no frontend.

essa poca deverá contemplar:
- backend em python (fastapi) com uma api simples que sirva dados dummy para o frontend
- frontend em vite (react) que consuma a api do backend
- uma pagina de signup/login com autenticação via email/senha (google auth será no futuro)
- ao logar, o usuario será redirecionado para uma dashboard simples que mostre um grafico (pode ser dummy data) e uma tabela (dummy data tbm)
- use docker compose para subir o backend e frontend e um banco de dados postgres

o plano deve ser sucinto, basicamente um apanhado com objetivo e estrategia em alto nível para realizarmos essa poc. 

Na sequencia, uma vez que eu aprovar o plano, iremos construir de fato o `.mini_specs/tasks.md` com as tasks detalhadas para cada etapa do plano. Deve ser um documento markdown separado por Fases e em cada fase deve haver um checklist de tasks a serem realizadas. A medida que as tasks forem sendo concluídas, iremos marcando como feitas.

Por fim, uma vez aprovadas as tasks, iremos executar as tasks para construir a poc.

---

TODOS

