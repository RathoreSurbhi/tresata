import React from 'react';
import { Series, interpolate, useCurrentFrame } from 'remotion';
import { Appear, Arrow, Box, C, Count, Footnote, Heading, Scene, Tag, progress, rupees } from './ui.jsx';

const s = (seconds) => Math.round(seconds * 30);

function Title({ dur }) {
  return (
    <Scene dur={dur} style={{ justifyContent: 'center' }}>
      <Appear at={5}>
        <div style={{ fontSize: 150, fontWeight: 800, color: C.human, letterSpacing: 2 }}>Virasat</div>
      </Appear>
      <Appear at={25}>
        <div style={{ fontSize: 54, marginTop: 10 }}>Helping families claim the money a parent left behind</div>
      </Appear>
      <Appear at={55}>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 50 }}>Take-home brief for Tresata · Surbhi Rathore, IIT Delhi</div>
      </Appear>
    </Scene>
  );
}

function Hook({ dur }) {
  const frame = useCurrentFrame();
  const strike = progress(frame, 150, 20);
  return (
    <Scene dur={dur} style={{ justifyContent: 'center' }}>
      <Appear at={0}>
        <div style={{ fontSize: 56, fontWeight: 600 }}>A plastic folder in Papa's almirah.</div>
      </Appear>
      <Appear at={25}>
        <div style={{ fontSize: 44, color: C.muted, marginTop: 14 }}>Some share certificates. One old fixed-deposit receipt.</div>
      </Appear>
      <div style={{ display: 'flex', gap: 120, marginTop: 80 }}>
        <Appear at={70}>
          <div style={{ fontSize: 34, color: C.muted }}>The family's guess</div>
          <div style={{ position: 'relative', fontSize: 120, fontWeight: 800 }}>
            ₹2,000
            <div style={{ position: 'absolute', left: 0, top: '52%', height: 10, width: `${strike * 100}%`, background: C.red, borderRadius: 5 }} />
          </div>
        </Appear>
        <Appear at={175}>
          <div style={{ fontSize: 34, color: C.muted }}>What it was worth</div>
          <div style={{ fontSize: 120, fontWeight: 800, color: C.green }}>
            <Count to={180000} at={180} dur={45} format={(v) => (v >= 99999 ? `₹${(v / 100000).toFixed(1)} lakh` : rupees(v))} />
          </div>
        </Appear>
      </div>
      <Appear at={250}>
        <div style={{ fontSize: 48, marginTop: 60 }}>
          Time to claim it: <b style={{ color: C.human }}>almost 2 years</b> and <b style={{ color: C.human }}>5 days of leave</b>
        </div>
      </Appear>
      <Footnote at={60}>Practitioner interview, Nagpur (name changed)</Footnote>
    </Scene>
  );
}

function Scale({ dur }) {
  return (
    <Scene dur={dur} style={{ justifyContent: 'center' }}>
      <Appear at={0}>
        <div style={{ fontSize: 130, fontWeight: 800, color: C.human }}>
          <Count to={73241} at={5} dur={50} format={(v) => `₹${Math.round(v).toLocaleString('en-IN')} crore`} />
        </div>
        <div style={{ fontSize: 40, color: C.muted }}>unclaimed in bank deposits, insurance and mutual funds (Feb 2026)</div>
      </Appear>
      <Appear at={110} style={{ marginTop: 80 }}>
        <div style={{ fontSize: 100, fontWeight: 800, color: C.green }}>
          <Count to={5777} at={115} dur={40} format={(v) => `₹${Math.round(v).toLocaleString('en-IN')} crore`} />
        </div>
        <div style={{ fontSize: 40, color: C.muted }}>returned to families in one 3-month campaign (Oct–Dec 2025)</div>
      </Appear>
      <Footnote at={30}>Source: PIB, Ministry of Finance, Rajya Sabha reply, March 2026</Footnote>
    </Scene>
  );
}

const Flow = ({ items, at, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 60 }}>
    {items.map((item, i) => (
      <Appear key={i} at={at + i * 22} dy={0}>
        {item.arrow ? (
          <Arrow label={item.arrow} />
        ) : (
          <Box color={item.color ?? color} style={{ width: 330, minHeight: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>{item.title}</div>
            {item.sub && <div style={{ fontSize: 25, color: C.muted, marginTop: 6 }}>{item.sub}</div>}
          </Box>
        )}
      </Appear>
    ))}
  </div>
);

function MoneyMoves({ dur }) {
  return (
    <Scene dur={dur}>
      <Heading>The money is never lost. It moves.</Heading>
      <Appear at={15}><div style={{ fontSize: 28, color: C.code, fontWeight: 700, marginBottom: 14 }}>SHARES</div></Appear>
      <Flow
        at={20}
        color={C.code}
        items={[
          { title: 'Paper certificate', sub: '"Old Co. Ltd", 1994' },
          { arrow: 'merger, swap ratio' },
          { title: 'Successor company', sub: 'new name, new registrar' },
          { arrow: 'dividends unpaid 7 years' },
          { title: 'IEPF', sub: 'government fund', color: C.human },
        ]}
      />
      <Appear at={130}><div style={{ fontSize: 28, color: C.ai, fontWeight: 700, marginBottom: 14 }}>BANK DEPOSITS</div></Appear>
      <Flow
        at={135}
        color={C.ai}
        items={[
          { title: 'FD receipt', sub: 'or old passbook' },
          { arrow: 'no activity 10 years' },
          { title: 'RBI DEA Fund', sub: 'branch may say "no account"', color: C.human },
          { arrow: 'still payable' },
          { title: 'Claim at same bank', sub: "bank's own document list" },
        ]}
      />
      <Appear at={270}>
        <div style={{ fontSize: 38 }}>Every arrow is a new office the family has to discover on its own.</div>
      </Appear>
    </Scene>
  );
}

function Quote({ dur }) {
  return (
    <Scene dur={dur} style={{ justifyContent: 'center', padding: '80px 200px' }}>
      <Appear at={5}>
        <div style={{ fontSize: 56, lineHeight: 1.35, fontStyle: 'italic' }}>
          "The form is easy. Knowing <span style={{ color: C.human }}>which form</span>, for{' '}
          <span style={{ color: C.human }}>which company</span>, in <span style={{ color: C.human }}>what order</span>, that took me two
          years and five leaves."
        </div>
      </Appear>
      <Appear at={60}>
        <div style={{ fontSize: 32, color: C.muted, marginTop: 40 }}>Rajesh, 48, Nagpur (name changed)</div>
      </Appear>
      <Appear at={150}>
        <div style={{ fontSize: 40, marginTop: 70 }}>
          The problem is not finding a form. It is the <b style={{ color: C.code }}>order</b> of steps across many offices.
        </div>
      </Appear>
    </Scene>
  );
}

const STEPS = [
  { who: 'HUMAN', color: C.human, title: 'Upload papers', sub: 'certificates, FD receipts' },
  { who: 'AI', color: C.ai, title: 'Read documents', sub: 'fields + exact quote as proof' },
  { who: 'HUMAN', color: C.human, title: 'Confirm every field', sub: 'against the photo' },
  { who: 'CODE', color: C.code, title: 'Match names', sub: 'initials always go back to the family' },
  { who: 'CODE', color: C.code, title: 'Company history', sub: 'renames, mergers, splits, bonuses; each cited' },
  { who: 'CODE', color: C.code, title: 'Rule book', sub: 'versioned, dated, sourced' },
  { who: 'CODE', color: C.code, title: 'Plan + pre-check', sub: 'right order, fewest visits' },
];

function Architecture({ dur }) {
  const frame = useCurrentFrame();
  const gate = progress(frame, 150, 20);
  return (
    <Scene dur={dur}>
      <Heading>
        <span style={{ color: C.ai }}>AI reads.</span> <span style={{ color: C.code }}>Code calculates.</span>{' '}
        <span style={{ color: C.human }}>Humans decide.</span>
      </Heading>
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', position: 'relative' }}>
        {STEPS.map((step, i) => (
          <React.Fragment key={i}>
            <Appear at={30 + i * 35} style={{ flex: 1 }}>
              <Box color={step.color} style={{ height: 300, padding: '18px 18px' }}>
                <Tag color={step.color}>{step.who}</Tag>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 18 }}>
                  {i + 1}. {step.title}
                </div>
                <div style={{ fontSize: 21, color: C.muted, marginTop: 12, lineHeight: 1.35 }}>{step.sub}</div>
              </Box>
            </Appear>
            {i === 2 && (
              <div style={{ width: 8, borderRadius: 4, background: C.red, opacity: gate, alignSelf: 'stretch' }} />
            )}
          </React.Fragment>
        ))}
      </div>
      <Appear at={170}>
        <div style={{ fontSize: 30, color: C.red, marginTop: 22, marginLeft: 560 }}>Gate: nothing unconfirmed crosses this line</div>
      </Appear>
      <Appear at={330}>
        <div style={{ fontSize: 40, marginTop: 60 }}>
          The AI never produces a share count, an amount or a legal threshold.
        </div>
      </Appear>
      <Appear at={430}>
        <div style={{ fontSize: 34, color: C.muted, marginTop: 24, lineHeight: 1.4 }}>
          A company missing from the history says <b style={{ color: C.text }}>"unknown"</b>, never a guess. Every line of the plan cites a rule or
          a document, so an auditor can check it without trusting the model.
        </div>
      </Appear>
    </Scene>
  );
}

const Line = ({ at, children, color = C.text, size = 36 }) => (
  <Appear at={at}>
    <div style={{ fontSize: size, color, marginBottom: 14, lineHeight: 1.3 }}>{children}</div>
  </Appear>
);

function DemoAnalysis({ dur }) {
  return (
    <Scene dur={dur}>
      <Heading size={52}>Prototype demo: Rajesh's case</Heading>
      <div style={{ display: 'flex', gap: 40 }}>
        <div style={{ width: 520 }}>
          <Line at={10} color={C.muted} size={26}>IN THE FOLDER</Line>
          <Appear at={20}>
            <Box color={C.human} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, color: C.muted }}>Share certificate, 1996</div>
              <div style={{ fontSize: 30, fontWeight: 700 }}>Vidarbha Cotton Processors Ltd</div>
              <div style={{ fontSize: 28 }}>"R. G. Wankhede" · 250 shares</div>
            </Box>
          </Appear>
          <Appear at={45}>
            <Box color={C.human}>
              <div style={{ fontSize: 22, color: C.muted }}>Fixed-deposit receipt</div>
              <div style={{ fontSize: 30, fontWeight: 700 }}>₹25,000 · matured 2009</div>
            </Box>
          </Appear>
          <Line at={70} color={C.muted} size={22}>Company and bank in this demo are synthetic.</Line>
        </div>
        <div style={{ flex: 1 }}>
          <Line at={90} color={C.muted} size={26}>WHAT VIRASAT WORKS OUT</Line>
          <Line at={100}>1996: 250 shares of Vidarbha Cotton</Line>
          <Line at={130} color={C.code}>2008 merger, 3 new for every 5 old (source cited)</Line>
          <Line at={160}>Today: <b>150 shares of Central India Agro</b></Line>
          <Line at={190}>Value about <b style={{ color: C.green }}>₹63,000</b> (range ₹56,700 – ₹69,300)</Line>
          <Line at={220}>Under the ₹5 lakh limit: no court succession certificate needed</Line>
          <Line at={260} color={C.code}>FD matured 2009 + 10 years: moved to the RBI DEA Fund by 2019</Line>
          <Line at={290}>Still payable. Claim it at the same bank.</Line>
          <Line at={330} color={C.human} size={32}>Shares are in IEPF: transmission with the company first, IEPF-5 form after.</Line>
        </div>
      </div>
    </Scene>
  );
}

const WARNINGS = [
  'Name on the certificate differs from PAN: prepare a name affidavit',
  'Initials only: the family must confirm it is the same person',
  'Find a surety now; a relative may refuse',
  'Bank says "no such account"? Show the printed RBI rule',
];

const VISITS = [
  ['Notary', '5 documents in one visit'],
  ['Bank branch', 'FD claim'],
  ['Tehsil office', 'legal heir certificate'],
  ['Post', 'transmission request'],
  ['Notary', 'IEPF indemnity bond'],
  ['Post', 'IEPF papers to company'],
];

function DemoPlan({ dur }) {
  const frame = useCurrentFrame();
  const visits = Math.round(interpolate(frame, [200, 250], [10, 6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return (
    <Scene dur={dur}>
      <div style={{ display: 'flex', gap: 60 }}>
        <div style={{ width: 760 }}>
          <Heading size={46}>Check before posting anything</Heading>
          {WARNINGS.map((w, i) => (
            <Appear key={i} at={20 + i * 30}>
              <Box color={C.red} style={{ marginBottom: 20, fontSize: 32 }}>{w}</Box>
            </Appear>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <Appear at={180}>
            <div style={{ fontSize: 46, fontWeight: 700, marginBottom: 20 }}>
              Visits: <span style={{ color: visits === 6 ? C.green : C.human, fontSize: 90 }}>{visits}</span>
              <span style={{ fontSize: 30, color: C.muted }}> instead of 10</span>
            </div>
          </Appear>
          {VISITS.map(([place, what], i) => (
            <Appear key={i} at={260 + i * 18}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', fontSize: 34, marginBottom: 16 }}>
                <span style={{ color: C.code, fontWeight: 700, width: 40 }}>{i + 1}</span>
                <b style={{ width: 250 }}>{place}</b>
                <span style={{ color: C.muted }}>{what}</span>
              </div>
            </Appear>
          ))}
          <Appear at={400}>
            <div style={{ fontSize: 26, color: C.muted, marginTop: 20 }}>Notary and tehsil work office hours only. Grouping tasks saves days of leave.</div>
          </Appear>
        </div>
      </div>
    </Scene>
  );
}

function ExactMaths({ dur }) {
  const items = [
    ['100', 'HDFC Ltd shares', C.text],
    ['× 42/25', '2023 merger into HDFC Bank', C.code],
    ['= 168', 'HDFC Bank shares', C.text],
    ['× 2', '1:1 bonus, Aug 2025', C.code],
    ['= 336', 'shares today', C.green],
  ];
  return (
    <Scene dur={dur}>
      <Heading>Why the numbers come from code, not AI</Heading>
      <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end', marginTop: 40 }}>
        {items.map(([big, small, color], i) => (
          <Appear key={i} at={20 + i * 40}>
            <div style={{ fontSize: 96, fontWeight: 800, color }}>{big}</div>
            <div style={{ fontSize: 26, color: C.muted }}>{small}</div>
          </Appear>
        ))}
      </div>
      <Appear at={240}>
        <div style={{ fontSize: 44, marginTop: 90 }}>
          Miss one event and the answer is off by half.
        </div>
      </Appear>
      <Appear at={280}>
        <div style={{ fontSize: 32, color: C.muted, marginTop: 20 }}>
          Exact fractions in code, and every event links to its stock-exchange filing.
        </div>
      </Appear>
      <Footnote at={60}>Sources: HDFC–HDFC Bank scheme of amalgamation (effective 1 Jul 2023); BSE notice 20250822-84</Footnote>
    </Scene>
  );
}

function Testing({ dur }) {
  return (
    <Scene dur={dur}>
      <Heading>Tested on 17 made-up families</Heading>
      <div style={{ display: 'flex', gap: 80, alignItems: 'center' }}>
        <Appear at={20}>
          <div style={{ fontSize: 140, fontWeight: 800, color: C.green }}>73/73</div>
          <div style={{ fontSize: 30, color: C.muted }}>checks pass</div>
        </Appear>
        <div style={{ flex: 1 }}>
          <Line at={70} color={C.muted} size={28}>TWO BUGS THE TESTS CAUGHT (BOTH FIXED)</Line>
          <Appear at={90}>
            <Box color={C.red} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 34, fontWeight: 700 }}>Same initials, different person</div>
              <div style={{ fontSize: 29, color: C.muted, marginTop: 6 }}>"R. G. Wankhede" could be Ramesh or Rekha. Now the family is always asked.</div>
            </Box>
          </Appear>
          <Appear at={200}>
            <Box color={C.red}>
              <div style={{ fontSize: 34, fontWeight: 700 }}>The ₹5 lakh limit is per company, not per certificate</div>
              <div style={{ fontSize: 29, color: C.muted, marginTop: 6 }}>Two ₹3.2 lakh certificates = ₹6.4 lakh. Now certificates are added up first.</div>
            </Box>
          </Appear>
        </div>
      </div>
      <Appear at={320}>
        <div style={{ fontSize: 32, marginTop: 50 }}>
          Also tested: rule changes over time (₹2 lakh before 2022, ₹5 lakh now), struck-off companies, unknown companies.
        </div>
      </Appear>
    </Scene>
  );
}

function Limits({ dur }) {
  const risks = [
    ['Wrong answers', 'a human confirms before any calculation'],
    ['Outdated rules', 'every rule has a date, source and review date'],
    ['Impostors', 'works only from documents the family holds'],
    ['Legal advice', 'never decides who the heir is; routes to an advocate'],
  ];
  return (
    <Scene dur={dur}>
      <Heading>Weakest point, said honestly</Heading>
      <Appear at={15}>
        <div style={{ fontSize: 38, lineHeight: 1.4 }}>
          The company history. Old, unlisted and struck-off companies are poorly recorded, and that is where the oldest certificates are.
        </div>
      </Appear>
      <Appear at={70}>
        <div style={{ fontSize: 34, color: C.code, marginTop: 24 }}>When unsure, Virasat says "unknown" and routes to a human.</div>
      </Appear>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 50 }}>
        {risks.map(([risk, answer], i) => (
          <Appear key={i} at={130 + i * 25}>
            <Box>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.human }}>{risk}</div>
              <div style={{ fontSize: 29, color: C.muted, marginTop: 4 }}>{answer}</div>
            </Box>
          </Appear>
        ))}
      </div>
    </Scene>
  );
}

function End({ dur }) {
  return (
    <Scene dur={dur} style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <Appear at={5}>
        <div style={{ fontSize: 130, fontWeight: 800, color: C.human }}>Virasat</div>
      </Appear>
      <Appear at={25}>
        <div style={{ fontSize: 44, marginTop: 10 }}>github.com/RathoreSurbhi/tresata</div>
      </Appear>
      <Appear at={45}>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 30 }}>Brief · Prototype · 17 test cases · Surbhi Rathore, IIT Delhi</div>
      </Appear>
    </Scene>
  );
}

const SCENES = [
  [Title, s(6)],
  [Hook, s(13)],
  [Scale, s(10)],
  [MoneyMoves, s(16)],
  [Quote, s(11)],
  [Architecture, s(26)],
  [DemoAnalysis, s(18)],
  [DemoPlan, s(16)],
  [ExactMaths, s(13)],
  [Testing, s(16)],
  [Limits, s(12)],
  [End, s(7)],
];

export const TOTAL_FRAMES = SCENES.reduce((sum, [, dur]) => sum + dur, 0);

export const Video = () => (
  <Series>
    {SCENES.map(([Component, dur], i) => (
      <Series.Sequence key={i} durationInFrames={dur}>
        <Component dur={dur} />
      </Series.Sequence>
    ))}
  </Series>
);
