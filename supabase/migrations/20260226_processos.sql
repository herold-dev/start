-- Create table for Processos (SOPs)
CREATE TABLE IF NOT EXISTS public.processos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT NOT NULL UNIQUE, -- 'admin', 'mateus', 'thamara' etc
    title TEXT NOT NULL,
    content TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

-- Create policies (Anyone authenticated can read and update them)
CREATE POLICY "Enable read access for authenticated users to processos" 
    ON public.processos FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable update access for authenticated users to processos" 
    ON public.processos FOR UPDATE 
    TO authenticated 
    USING (true);

-- Insert initial seed data based on roles
INSERT INTO public.processos (role, title, content)
VALUES
(
    'mateus',
    'Processos - Mateus (Captação e Edição)',
    '<h2>Manual de Operações: Audiovisual (Mateus)</h2>
    <p>Este documento detalha o fluxo operacional de ponta a ponta para a produção audiovisual da agência, garantindo padrão de qualidade, eficiência e alinhamento com a estratégia do cliente.</p>
    
    <h3>1. Agendamento e Preparação Pós-Fechamento</h3>
    <ul>
        <li><strong>Revisão de Briefing:</strong> Antes de qualquer contato, ler atentamente o perfil do cliente na aba "Clientes", absorvendo a paleta de cores, restrições e objetivos mapeados.</li>
        <li><strong>Contato Ativo:</strong> Entrar em contato com o cliente via WhatsApp (ou canal preferencial) para agendar a data e o horário da captação.
            <ul><li><em>Abordagem Padrão:</em> Apresentar-se como responsável audiovisual da Start Digital e alinhar a expectativa de tempo de gravação.</li></ul>
        </li>
        <li><strong>Roteirização Técnica:</strong> Trabalhar em conjunto com o planejamento (Thamara) para garantir que os roteiros aprovados sejam traduzidos em decupagem de cenas (o que gravar em B-Roll, o que será falado para a câmera).</li>
        <li><strong>Checklist de Equipamentos:</strong> No dia anterior, conferir carga de baterias, limpeza de lentes, formatação de cartões SD, microfones de lapela e estabilizadores.</li>
    </ul>

    <h3>2. Dia da Captação no Cliente</h3>
    <ul>
        <li><strong>Chegada e Rapport:</strong> Chegar com 15 minutos de antecedência. Quebrar o gelo com o cliente para deixá-lo confortável diante da câmera.</li>
        <li><strong>Direção de Arte e Cenário:</strong> Limpar o ambiente de poluição visual. Ajustar iluminação natural/artificial e compor o fundo de acordo com a identidade visual da marca.</li>
        <li><strong>Captação de Material Base (A-Roll):</strong> Gravar os vídeos roteirizados onde o cliente fala diretamente com a câmera. Focar na dicção, energia e repetição se necessário.</li>
        <li><strong>Captação de Apoio (B-Roll) e Fotos:</strong> Registrar detalhes da operação, equipe trabalhando, fachada, produtos em detalhes. Estas imagens são o respiro da edição e base para carrosséis estáticos.</li>
        <li><strong>Check-out:</strong> Mostrar algumas prévias rápidas na câmera para o cliente, agradecer e validar os próximos passos do fluxo (envio para aprovação).</li>
    </ul>

    <h3>3. Pós-Produção (Edição e Upload)</h3>
    <ul>
        <li><strong>Descarregamento Seguro (Backup):</strong> Transferir todo o material para o armazenamento local e imediatamente para o Google Drive na pasta respectiva do cliente (<code>Mídia Bruta / Mês Atual</code>).</li>
        <li><strong>Edição Dinâmica (Feed e Reels):</strong>
            <ul>
                <li>Cortar respiros, vícios de linguagem e "ééé".</li>
                <li>Adicionar legendas dinâmicas (fortemente recomendado para preterir visualização sem som).</li>
                <li>Incluir efeitos sonoros (SFX) sutis para transições e textos.</li>
                <li>Correção de cor (Color Grading) alinhada à paleta do cliente.</li>
            </ul>
        </li>
        <li><strong>Entrega e Integração:</strong> Subir os vídeos e fotos finais finalizados em alta qualidade no drive. Acessar o <em>Content Calendar</em> do cliente na plataforma e colar o link da mídia já editada no card respectivo daquele conteúdo para que a Thamara / Cliente possam avaliar e aprovar.</li>
    </ul>'
),
(
    'thamara',
    'Processos - Thamara (Comercial, Onboarding e Planejamento)',
    '<h2>Manual de Operações: Comercial & Estratégia (Thamara)</h2>
    <p>Este documento mapeia o coração estratégico e comercial da agência: buscar o cliente, fechar o negócio, integrá-lo e garantir a estratégia de conteúdo recorrente.</p>

    <h3>1. Motor de Prospecção (Comercial)</h3>
    <p>O objetivo é manter o funil sempre alimentado. A prospecção nunca pode parar, mesmo quando a agência estiver na capacidade máxima (gera fila de espera de alto valor).</p>
    <ul>
        <li><strong>Busca Ativa (Outbound):</strong> 
            <ul>
                <li><em>Estratégia de Nicho:</em> Focar a cada semana em um nicho específico (ex: Clínicas de Estética nesta semana, Escritórios de Advocacia na próxima).</li>
                <li><em>Caça no Instagram:</em> Buscar hashtags locais (ex: #ArquiteturaCuritiba), identificar perfis que têm produtos/serviços excelentes, mas presença digital mal posicionada (fotos amadoras, sem constância, design pobre).</li>
                <li><em>Abordagem (Cold DM/Cold Calling):</em> Não vender logo de cara. Elogiar o serviço, apontar sutilmente uma oportunidade de ouro não explorada no perfil e pedir permissão para enviar um material / marcar uma call rápida ("Pitch de 10 min").</li>
            </ul>
        </li>
        <li><strong>Gestão do Funil (Kanban CRM):</strong> Todo lead abordado <strong>deve</strong> entrar no Kanban (Aba CRM). Mover rigorosamente os cards: Contatado &gt; Reunião Agendada &gt; Proposta Enviada &gt; Fechado / Perdido. O follow-up (retorno) é onde o dinheiro está; agendar tarefas de retorno sempre.</li>
    </ul>

    <h3>2. Onboarding de Novos Clientes</h3>
    <p>O momento após o fechamento do contrato é quando o cliente está com a maior expectativa. Uma integração falha gera cancelamento rápido (Churn).</p>
    <ul>
        <li><strong>Criação de Perfil no App:</strong> Acessar a aba <em>Clientes</em> e criar o card do cliente. Preencher todas as informações básicas (Nome, Insta, Vencimento).</li>
        <li><strong>Dossiê (Aba Notas do Cliente):</strong> Preencher <strong>todas</strong> as abas de notas na plataforma. Qual o público-alvo? Paleta de cores? Tom de voz (Sério? Engraçado?) Quais serviços dão mais lucro? O que <em>nunca</em> pode ser postado?</li>
        <li><strong>Kick-off Meeting:</strong> Call de alinhamento com o cliente para aprofundar as informações das notas, pegar acessos das redes sociais (senhas) e alinhar expectativas de entrega.</li>
    </ul>

    <h3>3. Calendarização Mensal (O "Coração" do Serviço)</h3>
    <p>Planejar o conteúdo de forma antecipada para evitar a síndrome do "o que vamos postar hoje?".</p>
    <ul>
        <li><strong>Reunião Interna / Brainstorm (Dia 20 ao dia 25 do mês anterior):</strong> Sentar (ou fazer sozinha baseada no dossiê) e criar a estratégia do mês seguinte baseada nas datas comemorativas, promoções do cliente e funil de consciência (Atrair, Engajar, Vender).</li>
        <li><strong>Criação dos Cards (Plataforma):</strong> Na aba Calendário do cliente, preencher os cards daquele mês.
            <ul>
                <li><strong>Tema / Direcionamento:</strong> Escrever de forma clara qual o objetivo do post (Ex: "Reels educativo sobre as 3 causas da queda de cabelo").</li>
                <li><strong>Roteiro e Conteúdo:</strong> Escrever o texto por extenso. Se for Reels, escrever a fala exata ou tópicos. Se for carrossel, separar o texto das lâminas (Slide 1, Slide 2...).</li>
                <li><strong>Legenda Oficial:</strong> Escrever a legenda persuasiva com Chamada para Ação (CTA) e hashtags estudadas.</li>
            </ul>
        </li>
        <li><strong>Ponte com a Produção:</strong> Mover os posts criados para o status "Rascunho". Quando o roteiro estiver 100% pronto, avisar o Mateus para que ele marque a data da captação e leve os roteiros em mãos.</li>
        <li><strong>Fase Final (Aprovação):</strong> Quando a mídia chegar do Mateus, revisar a qualidade. Passar a bola para o cliente aprovar através do Link Público. Todo post deve estar como <em>Aprovado</em> antes do agendamento no Meta Business Suite.</li>
    </ul>'
),
(
    'admin',
    'Processos - Administração / Geral',
    '<h2>Rotinas Administrativas e Financeiras</h2>
    <p>A visão macro para garantir que a máquina operacional não pare e seja lucrativa.</p>
    <ul>
        <li><strong>Monitoramento de Saúde (Health Score):</strong> Toda sexta-feira, olhar o Dashboard inicial. Verificar a porcentagem de posts "Em Ajuste" ou "Rascunho" que já deveriam ter sido postados. O objetivo é a barra verde (Aprovados) beirar os 90%.</li>
        <li><strong>Faturamento e Fluxo de Caixa:</strong> Utilizar a aba Financeiro para lançar entradas (Fee mensal dos clientes) e Saídas (Assinatura de software de edição, tráfego, pro labore).</li>
        <li><strong>Reunião de Alinhamento 1:1:</strong> Semanalmente ou quinzenalmente, ter um momento com Mateus e Thamara individualmente para checar gargalos (Ex: "A edição tá demorando porque o PC está travando", "O fechamento diminuiu porque a objeção de preço está alta", etc).</li>
    </ul>'
)
ON CONFLICT (role) DO NOTHING;

-- Trigger to auto-update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_processos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_processos_updated_at ON public.processos;

CREATE TRIGGER trigger_update_processos_updated_at
    BEFORE UPDATE ON public.processos
    FOR EACH ROW
    EXECUTE FUNCTION update_processos_updated_at();

-- Update types reference in realtime (if applicable)
-- Note: Don't forget to push this table to Supabase via dashboard or DB URL
