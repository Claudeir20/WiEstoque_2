#!/usr/bin/env bash
# Prepara uma EC2 Ubuntu 24.04 para rodar o WiEstoque: swap, Docker e Docker Compose.
# Uso: bash aws/preparar-ec2.sh
set -euo pipefail

# O build do frontend e do Maven não cabe em 1 GB de RAM; 2 GB de swap evitam a falha por memória.
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
fi

sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 git postgresql-client
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

echo
echo "Pronto. Saia (exit) e entre de novo no SSH para usar o docker sem sudo."
