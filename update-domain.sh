#!/bin/bash

# Script para atualizar todas as referências de domínio
echo "Atualizando referências de domínio..."

# Encontrar e atualizar todos os arquivos
find . -type f \( -name "*.md" -o -name "*.ts" -o -name "*.tsx" \) -exec grep -l "SOS Moto\|sos-moto\|sosmoto" {} \; 2>/dev/null | while read file; do
    echo "Updating: $file"
    
    # Fazer backup antes de modificar
    cp "$file" "$file.bak"
    
    # Aplicar substituições
    sed -i 's/SOS Moto/Memoryys/g' "$file"
    sed -i 's/sos-moto/memoryys/g' "$file"
    sed -i 's/sosmoto\.com\.br/memoryys.com/g' "$file"
    sed -i 's/sosmoto-prod/memoryys-prod/g' "$file"
    sed -i 's/sosmoto-/memoryys-/g' "$file"
    sed -i 's/sosmoto/memoryys/g' "$file"
    
    # Remover backup se sucesso
    rm "$file.bak"
done

echo "✅ Todas as referências foram atualizadas!"