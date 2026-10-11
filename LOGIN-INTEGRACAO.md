# Tela de login — integração do backend

Abra /login no endereço do frontend (exemplo: http://localhost:8443/login).

A tela é apenas a interface. Não autentica, não cria uma sessão e não protege as outras páginas. O sistema existente continua acessível enquanto o backend de autenticação é desenvolvido.

O componente frontend/src/Login.tsx recebe onLogin({ username, password }): Promise<void> e onSuccess(): void. Conecte onLogin ao endpoint definido pelo backend; a Promise deve resolver somente após autenticação confirmada e rejeitar em caso de falha. onSuccess permite navegar após o sucesso. Não há endpoint ou formato de token presumido nesta entrega.

O formulário valida campos obrigatórios, permite mostrar/ocultar senha, envia com Enter, bloqueia envio duplicado e apresenta estados de carregamento e erro. A senha não é armazenada no navegador nem registrada em logs.

Quando o backend estiver pronto, integre a sessão, proteção de rotas e saída da conta. As APIs devem conferir autenticação e autorização no servidor.
