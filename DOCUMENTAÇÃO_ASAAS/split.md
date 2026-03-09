

# Split

Dúvidas frequentes sobre split na API do Asaas

# O que acontece quando estorno uma cobrança com split?

Em caso de estorno da cobrança, o Split também será estornado, ou seja, todas as contas que receberam o saldo da cobrança em questão terão a transferência estornada.

# Tem limite de carteira (wallet) para realizar split?

Não há limite no número de walletId a serem enviados no split. A limitação sempre será o valor líquido total da cobrança em casos de valores fixos e a distribuição de 100% nos splits em valores percentuais.

# Posso enviar o dinheiro do split para a minha subconta X dias após o recebimento?

Não. O split é feito automaticamente no momento do recebimento, não tem como personalizar. Nesse caso, ao invés de usar o split de pagamentos, você usará as[ transferências entre contas Asaas](https://docs.asaas.com/reference/transferir-para-conta-asaas). Para isso, você criará a cobrança normalmente, sem split, receberá todo o valor na sua conta e apenas no dia desejado, conforme sua operação, realizará a transferência do valor para a subconta.

# É possível utilizar o split se eu não tiver integração API?

O split de pagamentos é uma funcionalidade **exclusiva** da API do Asaas, não podendo ser utilizado ou gerenciado através do uso pelo site.

# O que preciso para fazer split de pagamentos no Asaas?

Para fazer Split de cobranças é necessário que você tenha o walletId de todas as contas Asaas envolvidas nas transações.

# Quem deve configurar o split de pagamento?

O split de pagamento deve ser configurado por quem está criando a cobrança. É necessário informar o WalletId da conta que receberá a comissão e o valor fixo ou percentual que será repassado.\
No Asaas, o split só pode ser configurado por meio da API, e todos os envolvidos precisam ter uma conta na plataforma para que o repasse seja realizado corretamente.

# Como funciona a divisão de comissão no split?

A divisão de comissão no split permite que o valor de uma cobrança seja automaticamente dividido entre as partes envolvidas. Isso pode ser feito utilizando uma porcentagem ou um valor fixo.

# Como o sistema calcula o valor a ser repassado, quando a comissão é configurada por porcentagem?

Quando a comissão é configurada como porcentagem, o cálculo é feito sobre o valor líquido da cobrança.

# É possível definir mais de uma porcentagem para dividir o valor entre várias pessoas?

Sim, você pode configurar diferentes porcentagens para várias pessoas. O sistema distribui o valor líquido proporcionalmente de acordo com as porcentagens definidas. Desde que não ultrapasse os 100%

# Como funciona a divisão de comissão com valor fixo?

Quando o split é configurado com valor fixo, você define um valor exato que será repassado, independentemente do valor total da cobrança.\
Importante: O valor fixo não pode ser superior ao valor líquido da cobrança.

# O que acontece se a soma das porcentagens exceder 100%?

O sistema não permitirá que a configuração do split exceda 100%. Se você tentar configurar porcentagens que somem mais de 100%, será exibida uma mensagem de erro.

# Como a taxa do Asaas afeta a divisão por porcentagem?

A taxa do Asaas é descontada antes de o valor ser dividido entre as partes. A porcentagem é aplicada apenas sobre o valor líquido da cobrança.