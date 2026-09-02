import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Semana da Esperança 2026',
  description: 'Política de privacidade e proteção de dados da plataforma Semana da Esperança 2026, em conformidade com a LGPD.',
  robots: { index: true, follow: true },
}

export default function PrivacyPolicyPage() {
  return (
    <div 
      className="min-h-svh"
      style={{ background: 'var(--cream)' }}
    >
      <div className="container-narrow py-16">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-12">
          <a 
            href="/"
            className="text-small flex items-center gap-1"
            style={{ color: 'var(--gray-400)' }}
          >
            ← Voltar
          </a>
          <h1 
            className="text-heading-1"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-900)' }}
          >
            Política de Privacidade
          </h1>
          <div 
            className="p-4 rounded-xl text-small"
            style={{ 
              background: 'rgba(232, 213, 176, 0.3)', 
              border: '1px solid var(--champagne)',
              color: '#8B6914',
            }}
          >
            ⚖️ <strong>Aviso Legal:</strong> Este texto é uma versão inicial gerada para a plataforma. 
            Deve obrigatoriamente passar por revisão jurídica antes da publicação definitiva, 
            conforme exigido pela Lei Geral de Proteção de Dados Pessoais (LGPD — Lei 13.709/2018).
          </div>
          <p className="text-small" style={{ color: 'var(--gray-500)' }}>
            Versão 1.0 — Em vigor a partir de setembro de 2026
          </p>
        </div>

        {/* Content */}
        <div 
          className="flex flex-col gap-8"
          style={{ color: 'var(--gray-700)', lineHeight: 1.75 }}
        >
          <section className="flex flex-col gap-3">
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              1. Quem somos
            </h2>
            <p>
              Esta plataforma é operada pela <strong>Associação Gaúcha — Semana da Esperança</strong> 
              (doravante denominada &ldquo;Organização&rdquo;), responsável pelo tratamento dos dados pessoais 
              coletados neste site.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              2. Dados que coletamos
            </h2>
            <p>Coletamos apenas os dados estritamente necessários para as finalidades descritas:</p>
            <ul className="flex flex-col gap-2" style={{ paddingLeft: '1.5rem' }}>
              <li><strong>Nome</strong> — para personalização da comunicação e identificação</li>
              <li><strong>Número de WhatsApp</strong> — para envio do material digital solicitado e, 
                se autorizado, envio de lembretes da programação</li>
              <li><strong>Dados de localização</strong> — cidade e bairro informados voluntariamente, 
                para identificação da igreja participante mais próxima</li>
              <li><strong>Dados de acesso</strong> — endereço IP, tipo de dispositivo, 
                informações de navegação, para segurança e analytics (dados anonimizados para relatórios)</li>
              <li><strong>Parâmetros UTM</strong> — para análise da eficiência das campanhas de divulgação</li>
            </ul>
            <p>
              <strong>Não coletamos:</strong> CPF, RG, endereço residencial completo, dados financeiros 
              ou quaisquer outros dados sensíveis desnecessários.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              3. Finalidade do tratamento
            </h2>
            <p>Seus dados são utilizados para:</p>
            <ul className="flex flex-col gap-2" style={{ paddingLeft: '1.5rem' }}>
              <li>Identificar a igreja participante da campanha mais próxima ao seu bairro</li>
              <li>Disponibilizar o material digital gratuito solicitado (livro digital)</li>
              <li>Enviar lembretes da programação via WhatsApp, <strong>somente se você autorizar</strong></li>
              <li>Permitir que a organização e a igreja conheçam o interesse da comunidade na campanha</li>
              <li>Análise estatística e melhoria das campanhas (dados anonimizados)</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              4. Base legal (LGPD)
            </h2>
            <p>
              O tratamento dos seus dados é realizado com base no seu <strong>consentimento expresso</strong> 
              (Art. 7º, I da LGPD), fornecido ao preencher o formulário e marcar a caixa de consentimento. 
              Para o envio de lembretes via WhatsApp, obtemos um consentimento separado e específico.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              5. Compartilhamento de dados
            </h2>
            <p>
              Seus dados poderão ser acessados pela <strong>organização responsável pela campanha</strong> e 
              pela <strong>igreja participante</strong> para a qual você foi direcionado, com a finalidade 
              exclusiva de gestão da campanha e envio de lembretes quando autorizado.
            </p>
            <p>
              Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins comerciais.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              6. Retenção dos dados
            </h2>
            <p>
              Seus dados serão mantidos pelo prazo necessário para as finalidades descritas, 
              observado o mínimo legal. A organização poderá definir uma política de retenção e 
              anonimização automática para dados de campanhas encerradas.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              7. Seus direitos (LGPD)
            </h2>
            <p>Como titular de dados, você tem direito a:</p>
            <ul className="flex flex-col gap-2" style={{ paddingLeft: '1.5rem' }}>
              <li>Confirmação da existência de tratamento</li>
              <li>Acesso aos dados que temos sobre você</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação dos seus dados</li>
              <li>Revogação do consentimento a qualquer momento</li>
              <li>Oposição ao tratamento em caso de descumprimento da LGPD</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              8. Segurança
            </h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra 
              acesso não autorizado, perda acidental ou destruição. Os dados são armazenados em 
              servidores seguros com controle de acesso por função (RBAC) e políticas de segurança 
              em nível de banco de dados (RLS).
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              9. Contato e exercício de direitos
            </h2>
            <p>
              Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato 
              pelo e-mail: <a href="mailto:privacidade@evangelismo.app" style={{ color: 'var(--red)' }}>
                privacidade@evangelismo.app
              </a>
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              10. Cookies e rastreamento
            </h2>
            <p>
              Utilizamos tecnologias de rastreamento (como Meta Pixel, Google Analytics e Google Tag 
              Manager) para análise de desempenho das campanhas. Essas tecnologias podem coletar 
              informações de navegação de forma anonimizada. Você pode bloquear esses rastreadores 
              nas configurações do seu navegador.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              11. Alterações desta política
            </h2>
            <p>
              Esta política pode ser atualizada periodicamente. A data de vigência estará sempre 
              indicada no início do documento. Em caso de alterações significativas, você será 
              notificado.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div 
          className="mt-12 pt-8 border-t flex flex-col gap-2"
          style={{ borderColor: 'var(--gray-100)' }}
        >
          <p className="text-small" style={{ color: 'var(--gray-400)' }}>
            Semana da Esperança 2026 — Associação Gaúcha
          </p>
          <p className="text-caption" style={{ color: 'var(--gray-400)' }}>
            Em conformidade com a Lei Geral de Proteção de Dados — Lei 13.709/2018 (LGPD)
          </p>
        </div>
      </div>
    </div>
  )
}
