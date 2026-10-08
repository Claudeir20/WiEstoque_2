# Instalacao no PC do estoque

Este pacote instala o sistema completo em um computador com Windows, usando Docker Desktop. O acesso fica restrito ao proprio computador em http://localhost:8085.

## Antes de instalar

1. Confira a edicao e versao do Windows, a memoria RAM e a virtualizacao. A instalacao depende de compatibilidade com o Docker Desktop; confirme os requisitos em https://docs.docker.com/desktop/setup/install/windows-install/.
2. Instale o Docker Desktop com suporte a containers Linux e WSL 2. Reinicie o computador quando solicitado.
3. Abra o Docker Desktop e aguarde o mecanismo ficar pronto. A primeira instalacao do sistema precisa de internet.
4. Confira a licenca do Docker Desktop para uso na empresa: https://docs.docker.com/subscription-billing/desktop-license/.

## Primeira instalacao

1. Extraia o pacote completo em uma pasta permanente, por exemplo `C:\Sistema de estoque`. Nao execute dentro do ZIP ou no pendrive.
2. Abra `Instalar.cmd`. Ele prepara o sistema, cria uma senha local para o banco e um atalho na area de trabalho.
3. Aguarde a conclusao. Abra o atalho `Sistema de Estoque` ou http://localhost:8085.
4. Confira os dados com `implantacao\dados-iniciais-manifesto.json`, que registra as contagens do banco no momento da exportacao.
5. Abra `Backup.cmd` para testar o primeiro backup. Depois abra `Ativar backup diario.cmd`, que configura um backup as 17h.

A senha do banco fica no arquivo `.env`, criado durante a instalacao. Preserve esse arquivo na pasta do sistema. Nao e necessario instalar Java, Node.js ou PostgreSQL diretamente no Windows.

## Uso diario

Nas configuracoes do Docker Desktop, ative a inicializacao ao entrar no Windows. Os servicos do sistema reiniciam quando o Docker inicia. Para abrir o sistema, use o atalho; se precisar iniciar os servicos novamente, use `Iniciar.cmd`.

O backup agendado depende do usuario conectado, do computador ligado e do Docker funcionando. Os arquivos ficam em `backups`. Copie-os regularmente para outro disco, pendrive ou local da empresa. Backup apenas no mesmo computador nao protege contra falha do disco.

## Dados transferidos

Os dados iniciais sao uma copia do banco no momento de preparar o pacote. Eles entram automaticamente somente quando o banco Docker e criado pela primeira vez. Os dados que voce cadastrar depois ficam no volume persistente do Docker.

Se voce usar o sistema neste computador depois da exportacao, gere uma nova copia antes de levar o pacote para a empresa. O pacote nao sincroniza dois computadores.

Nao apague o volume `sistema-estoque_dados` nem use `docker compose down -v`: isso apaga o banco. Reexecutar `Instalar.cmd` preserva o banco ja existente e nao reaplica os dados iniciais.

## Atualizacoes e recuperacao

Antes de atualizar, execute `Backup.cmd`. Preserve `.env`, os backups e o volume do banco. Para recompilar uma versao atualizada, abra um terminal na pasta e execute `docker compose up -d --build --wait`.

Para conferir problemas, execute `docker compose ps` e `docker compose logs --tail=100`. Se a porta 8085 estiver ocupada, libere-a antes de instalar.

Os backups `.dump` podem ser restaurados com `pg_restore`. A restauracao deve ser feita com o sistema parado e para um banco definido, conferindo o backup antes de substituir dados; nao existe restauracao automatica que sobrescreva cadastros.

O sistema ainda nao tem login. Este pacote publica o acesso apenas no proprio PC, sem expor o banco ou a API na rede.
