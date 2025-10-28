import { GeneratedConfig } from './vibesdk'

export interface DeploymentScriptOptions {
  projectName: string
  deploymentTarget: 'vercel' | 'netlify' | 'self-hosted'
  environmentVariables?: Record<string, string>
  customDomain?: string
  buildCommand?: string
  outputDirectory?: string
  framework?: 'next' | 'react'
  includeContracts?: boolean
  includeFrontend?: boolean
  includeAPI?: boolean
}

export interface EnvironmentConfig {
  development: Record<string, string>
  staging: Record<string, string>
  production: Record<string, string>
}

export interface BuildOptimizationConfig {
  enableMinification: boolean
  enableCompression: boolean
  enableTreeShaking: boolean
  enableCodeSplitting: boolean
  enableImageOptimization: boolean
  enableStaticGeneration: boolean
  bundleAnalyzer: boolean
}

/**
 * Deployment Script Generator
 * Creates deployment scripts and configurations for different platforms
 */
export class DeploymentScriptGenerator {
  private options: DeploymentScriptOptions

  constructor(options: DeploymentScriptOptions) {
    this.options = options
  }

  /**
   * Generate all deployment-related files
   */
  generateDeploymentFiles(): GeneratedConfig[] {
    const configs: GeneratedConfig[] = []

    // Generate deployment scripts
    configs.push(this.generateDeployScript())
    configs.push(this.generateBuildScript())
    configs.push(this.generateEnvSetupScript())

    // Generate environment management
    configs.push(this.generateEnvironmentManager())
    configs.push(this.generateEnvironmentConfigs())

    // Generate build optimization configurations
    configs.push(this.generateBuildOptimizationConfig())
    configs.push(this.generateProductionOptimizations())

    // Generate platform-specific configurations
    switch (this.options.deploymentTarget) {
      case 'vercel':
        configs.push(this.generateVercelConfig())
        configs.push(this.generateVercelGuide())
        break
      case 'netlify':
        configs.push(this.generateNetlifyConfig())
        configs.push(this.generateNetlifyGuide())
        break
      case 'self-hosted':
        configs.push(this.generateDockerConfig())
        configs.push(this.generateSelfHostedGuide())
        break
    }

    // Generate CI/CD configurations
    configs.push(this.generateGitHubActions())
    configs.push(this.generatePreDeploymentChecks())

    return configs
  }

  /**
   * Generate main deployment script
   */
  private generateDeployScript(): GeneratedConfig {
    const script = `#!/bin/bash

# Deployment script for ${this.options.projectName}
set -e

echo "🚀 Starting deployment..."

# Check dependencies
check_deps() {
    command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }
    command -v pnpm >/dev/null 2>&1 || { echo "pnpm required"; exit 1; }
}

# Install and build
build_app() {
    echo "Installing dependencies..."
    pnpm install --frozen-lockfile
    
    echo "Building application..."
    ${this.options.buildCommand || 'pnpm build'}
}

# Deploy based on platform
deploy() {
    case "${this.options.deploymentTarget}" in
        "vercel")
            command -v vercel >/dev/null 2>&1 || { echo "Vercel CLI required"; exit 1; }
            vercel --prod
            ;;
        "netlify")
            command -v netlify >/dev/null 2>&1 || { echo "Netlify CLI required"; exit 1; }
            netlify deploy --prod --dir=${this.options.outputDirectory || 'out'}
            ;;
        "self-hosted")
            echo "Creating deployment package..."
            tar -czf deployment-package.tar.gz .next public package.json
            echo "Upload deployment-package.tar.gz to your server"
            ;;
    esac
}

main() {
    check_deps
    build_app
    deploy
    echo "🎉 Deployment completed!"
}

main "$@"
`

    return {
      filename: 'scripts/deploy.sh',
      code: script,
      configType: 'deployment'
    }
  }

  /**
   * Generate build script
   */
  private generateBuildScript(): GeneratedConfig {
    const script = `#!/bin/bash

# Build script for ${this.options.projectName}
set -e

echo "🔨 Building ${this.options.projectName}..."

# Clean previous builds
rm -rf .next out dist

# Set production environment
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Install dependencies
pnpm install --frozen-lockfile

# Build application
${this.options.buildCommand || 'pnpm build'}

echo "✅ Build completed successfully!"
`

    return {
      filename: 'scripts/build.sh',
      code: script,
      configType: 'deployment'
    }
  }

  /**
   * Generate environment setup script
   */
  private generateEnvSetupScript(): GeneratedConfig {
    const script = `#!/bin/bash

# Environment setup script for ${this.options.projectName}
set -e

echo "🔧 Setting up environment..."

# Create .env.local from template
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "Created .env.local from template"
        echo "Please edit .env.local with your actual values"
    else
        echo "No .env.example found"
        exit 1
    fi
else
    echo ".env.local already exists"
fi

# Install dependencies
pnpm install

echo "✅ Environment setup completed!"
echo "Run 'pnpm dev' to start development server"
`

    return {
      filename: 'scripts/setup-env.sh',
      code: script,
      configType: 'deployment'
    }
  }

  /**
   * Generate Vercel deployment guide
   */
  private generateVercelGuide(): GeneratedConfig {
    const guide = `# Vercel Deployment Guide

## Quick Deploy
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

## Environment Variables
Set these in your Vercel project settings:
- \`OPENAI_API_KEY\` - Your OpenAI API key
- \`NEXT_PUBLIC_FLOW_NETWORK\` - Flow network (mainnet/testnet)
- \`NEXT_PUBLIC_APP_NAME\` - ${this.options.projectName}

## Manual Deploy
\`\`\`bash
npm i -g vercel
vercel login
vercel --prod
\`\`\`

## Custom Domain
1. Go to project settings in Vercel
2. Add your domain in "Domains" section
3. Configure DNS as instructed
`

    return {
      filename: 'docs/VERCEL_DEPLOYMENT.md',
      code: guide,
      configType: 'deployment'
    }
  }

  /**
   * Generate Netlify deployment guide
   */
  private generateNetlifyGuide(): GeneratedConfig {
    const guide = `# Netlify Deployment Guide

## Quick Deploy
1. Connect repository to Netlify
2. Set build command: \`pnpm build\`
3. Set publish directory: \`out\`
4. Configure environment variables

## Environment Variables
Add these in Site settings > Environment variables:
- \`OPENAI_API_KEY\` - Your OpenAI API key
- \`NEXT_PUBLIC_FLOW_NETWORK\` - Flow network
- \`NEXT_PUBLIC_APP_NAME\` - ${this.options.projectName}

## Manual Deploy
\`\`\`bash
npm install -g netlify-cli
netlify login
pnpm build
netlify deploy --prod --dir=out
\`\`\`
`

    return {
      filename: 'docs/NETLIFY_DEPLOYMENT.md',
      code: guide,
      configType: 'deployment'
    }
  }

  /**
   * Generate environment variable managemem
   */
  private generateEnvironmentManager(): GeneratedConfi{
    const manager = `#!/bin/bash

# Environment VariablectName}
set -e

SCRIPT_DIR="$(cd "$(d"
PROJECT_ROOT="$(d

# Environment confi


# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0
NC='\\033

# Logging functions
log_info() {
    echo -e "\${BLUE}[INFO]\"
}

log_success {
    echo -e "\
}

log_warning() {
    echo -e "\
}

log_error() {
    ech1"
}

# Check if environment file exists
check_env_file() {
    loca
    ; then
        l_file"
urn 1
    fi
    return 0
}

# Vali
v() {

    local re")
    
    ${this.options}
    ${this.options.includeAPI : ''}
    
   e"
 
}
  }   }loyment'
 Type: 'dep      config
de: guide,     cod',
 ENT.mDEPLOYMLF_HOSTED_: 'docs/SEame   filenurn {
   ret`

    \`\`
}
\`ameons.projectN.opti} ${thisjectName.proons{this.optiname $:3000 --d -p 3000n -er rume} .
dockns.projectNa${this.optiod -t builsh
docker bae
\`\`\`ativ Altern
## Docker\`\`

   \`  }      }
 
 mote_addr;eal-IP $rer X-Rt_heade    proxy_se
       ost $host;t_header H_se      proxy0;
     300t:://localhos_pass http      proxy / {
     tion loca   
      };
    domain.com'| 'your-ain |omons.customDopti{this.r_name $rve     se;
    listen 80r {
     serve\`nginx
     \`\`*
 igure Nginx* **Conf`\`

3.\   \`
artup st   pm2e
sav pm2    -- start
ectName}"s.projhis.optionme "${tpm --na nart st pm2
   pm2tall -ginsnpm 
   mended)2 (recomsing PM  # Uh
 \`bas\`*
   \`cation*tart appli
2. **S\`\`
`d
   \pm builrod
   pnnstall --p}
   pnpm iNameects.proj{this.option}
   cd $ectNamens.projs.optio-url> ${thilone <repo git c
  bash  \`\`\`ild**
 lone and bups

1. **Cployment Ste

## Deicate SSL certifd)
-ndemeinx (recom pnpm
- Ng18+
-- Node.js ments
irerver Requ Sede

##yment Guisted Deplo-Holf`# Seguide = const fig {
    edConrat(): GeneedGuidelfHosterateSerivate gen
   */
  p guided deploymentelf-hoste Generate s/**
   *
  
  }
nt'
    }oymepe: 'deplonfigTyt,
      c scripode:   csh',
   ks.y-checre-deploipts/p: 'screname     filrn {
 
    retu
`

main "$@"port
}
e_re
    generatty
    ibilick_accessnce
    che_performackhe
    csecurityheck_
    cntioura_configck ches
   ependenciecheck_d  ifacts
  rtild_a    check_but
_environmen
    check"
    ho "
    ectName}..."s.projec.optionthisecks for ${nt ch-deploymereg po "🔍 Runnin
    ech() {cution
mainMain exe}

# 
    fi
urn 1 ret     ment."
  fore deploy issues be. Fixks failedome chec"❌ S    echo  else
     fi
    0
           return        ent."
fore deploymrnings beReview waassed. cal checks pl criticho "✅ Al           e
      else
   urn 0      ret   nt."
   yme deplo Ready forpassed!ks 🎉 All chec  echo "          n
eq 0 ]; the $WARNINGS -      if [hen
  D -eq 0 ]; tFAILECHECKS_[ $  
    if 
  cho ""e%"
    eass_rat$ps rate: ho "Pas    
    ecchecks ))
0) / total_SED * 10_PAS(CHECKS_rate=\$(( ocal passED))
    l_FAILED + CHECKSS_PASS$((CHECKcks=\l_che  local tota  
  "
  o ""
    echs: $WARNINGSrningcho "⚠️  Wa"
    eCKS_FAILEDled: $CHEhecks faicho "❌ C   eSSED"
 S_PA: $CHECKs passed✅ Check echo " ""
   echo"
    =================================  echo "=  
REPORT" CHECK EPLOYMENT   PRE-Decho ""
    ============================="=====cho 
    e""echo     eport() {
ate_r
generate report# Generi
}


    f"consideredibility is essensure accfound - s attributeg "No ARIA _warnin        loglse

    e"onentsmpin coes found  attributARIAcess "_suc        logn
1; thedev/null 2>&x" . >/js"*.nclude=*.tsx" --ie="includria-" --|a "role=\\  if grep -r)
  basic check usage (emantic HTML for s# Check    
    

    fionfigured"inting not cbility l "Accessiing log_warn
       lse e"
   guredg confiity lintinibil"Access_success         logen
.json; thy" packagen-jsx-a11lugiint-p "eslp -qf grees
    ity packagcessibiliCheck for ac
    # .."
    iguration. confssibilitycking acceChenfo "   log_iity() {
 accessibil
check_

}
    fifi   "
     mages foundd i unoptimizergecess "No la  log_suc           else

       rectory"ic dipubln ) found i (>1MBmageses large iimag "$large_rninglog_wa   
          0 ]; thens" -gt$large_image [ "     if)
   | wc -lrint \$9}' 576 {p$5 > 1048 awk '\ll |/dev/nua 2> -ls lsg" | xargname "*.jpeg" -o -.jp"*e  -nam"*.png" -oc -name $(find publi\images=rge_    local lahen
    " ]; t-d "publicn
    if [ ioate optimizmagheck for i # Ci
    
    f   fi
   
     le_size)"($bund reasonable size isndle  "Bug_success lo             else
 on"
     atier optimizsidze) - con($bundle_si large dle size isg "Bun  log_warnin        ; then
  0 ]-gt 1024ytes" e_biz"$s   if [ 
     -f1)cut | >/dev/null xt/static 2.ne\$(du -s ytes=ze_blocal si)
        MBrge (>10 landle is veryrn if bu        # Wa     
   ize"
bundle_se: $Bundle siznfo "     log_i  t -f1)
 l | cu/nul>/dev/static 2du -sh .next\$(ze=le_sind    local bu
    ; thentic" ]ext/sta.nf [ -d "size
    ie ck for bundl   # Che"
    
 iguration...onfe crformanchecking peg_info "C) {
    lormance(ck_perfo}

chei
"
    foundecrets f sdedous hardco "No obvig_success      lo else
  de"
   source coin s found etdcoded secrential har"Potg_warning       lon
   2>&1; thenullv/" . >/dee="*.tsxincludsx" --nclude="*.js" --ilude="*.ts" --include="*.j|key" --incsecret\\sword\\|r "pas -
    if greptsed secrehardcodCheck for   
    # fi
     t found"
 gitignore norror ".log_e
        seel done
      
              fiore"
   itignd be in .gtern shoulning "$patar log_w           e
             els"
   d is ignore"$patternsuccess         log_
        thene; .gitignorrn" "$pattegrep -q f          i"; do
   ]}erns[@{ignore_pattrn in "\$patte    for   
  ").nextdules" "de_mocal" "nos=(".env.loternatgnore_pal i
        loc        "
xistsgnore ess ".giti log_succe       ; then
" ]itignore.g if [ -f "e
    .gitignorCheck   # 
    
     done
       fi
  $pattern"les found:ensitive fi_warning "S    log    
    then&1;  2>n >/dev/nullter$patls         if 
do"; [@]}sitive_files{senn "\$pattern i   for 
 m")"*.pe"*.key" ocal" ".env.l=(".env" ve_filesal sensitiloc
    ilese fivk for sensit# Chec
    
    ion..."uratconfigurity cking secnfo "Cheog_i l
   rity() {
check_secuac
}
    es ;;
              fi
    nd"
     foution not configuraker g "Doc  log_warnin           se
     el     "
     istson exfiguratiocker coness "Dog_succ          l
       ]; thenerfile""Dock   if [ -f        ed")
  host   "self-  ;;
                    fi
 "
      oundn not fnfiguratio co "Netlifyg_warning lo           
          else  "
    tsation exisonfigurify cccess "Netl  log_su              " ]; then
tomlfy.[ -f "netlif     i       lify")
     "net
       ;;   
               fi"
   ndfouion not l configuratning "Verce     log_war            else
         
  "tsuration exiscel config"Versuccess        log_     en
    on" ]; th"vercel.js  if [ -f      
     ")cel"ver        in
 get}"Tarloymentons.dep.opti"${thisse  ca   orm config
atf plmentDeploy    
    # }
 : ''fi
    `
    nd"ou not fonti configuraipteScr "Typog_error    l
      else  fi
     ed"
   ablot entrict mode nypeScript s"Twarning   log_          se
     el
   abled"e enict modipt strpeScrss "Tysucce      log_
      thenjson; nfig. true' tsco\\":\"strict -q '\ grep    if  
  strict modeCheck for  #    
       s"
     ration existgupt confiScriess "Typeg_succ
        lon" ]; thennfig.jso[ -f "tsco
    if ? `escript ns.typ.optiothis
    ${pt configeScri  # Typ
    fi
   
    found"ration notfigu"Next.js conng ni_war log
          elsests"
 on exiurati configNext.jss "cces_su
        loghen" ]; t.jsignft.co [ -f "nexg.mjs" ] ||"next.confi    if [ -f s config
ext.j   
    # N
 files..."n ioatonfigurhecking clog_info "C
    ) {on(tiuraheck_config fi
}

c"
   ot foundckage.json nror "Pa   log_er     else
     
       fi
     fi
             e"
  up to datncies are l dependess "Al log_succe               else
           nd"
 ndencies fouated depetdated outd$ouing "   log_warn       n
       0 ]; thegtated" -[ "$outd       if 0")
     cho "ll || e2>/dev/nuh  lengt jqull |ev/nson 2>/d --format jtdated(pnpm ou\$outdated=    local        >&1; then
 ev/null 2pnpm >/dcommand -v       if ies
  ed dependencor outdat   # Check f          
   fi
   fi
                 s"
or detail audit' fpnpm run 'tected -s deabilitienerurity vulSecning "log_war       
              else     found"
  ties abilirity vulnerty secuigh-severiess "No h_succ   log        
     l 2>&1; thendev/nulte >/level moderait-it --aududpnpm a       if     
 >&1; then/dev/null 2nd -v pnpm >ma   if com   ties
  biliulneraity vor securheck f# C     
         ists"
   exson "Package.jg_success       lohen
  ]; tkage.json""pac [ -f if  
    
  ncies..."ndeng depe"Checkinfo  log_i {
   ndencies()
check_depe    fi
}
rst"
d' fi buil - run 'pnpmy not foundd director"Buil  log_error se
       el
       
     fi  ing"
     issory m directtsc asse "Statierror log_       else
       
     ts"ory exisssets directtatic acess "S log_suc       ; then
    tic" ]xt/sta [ -d ".ne  if
                   fi

   missing"D file Build Ior "  log_err         lse
       e"
  ists file exIDuild ss "B log_succe
           " ]; thenD_IDBUIL".next/-f     if [ les
    essential fik for  Chec #  
            "
 sts exirectoryld di bui.jscess "Nextog_suc
        l" ]; thennext if [ -d ".
   
    cts..."ifald artui"Checking bnfo {
    log_itifacts() _build_arecki
}

ch  fund"
   file not foironment envuctionor "Prodg_err      lo  else
  
  
             fi
   "vironmentduction enroed in ptects deent valuevelopmng "Denig_warlo        hen
    nv_file"; tpment" "$e\\|develo.0.1st\\|127.0localho grep -q "  if     ction
 produs in nt valueopmer devel Check fo
        #            done
       fi
       ing"
  iss mvar isariable $Required vr "og_erro l         e
             els
     "$var is setble varia "Required  log_success          n
      the_file";ar=" "$env$vep -q "^grif         do
     vars[@]}";quired_n "\${re   for var i
     '}
        Y")' : 'KE_API_("OPENAI_vars+=requiredcludeAPI ? '.inptions   ${this.o ''}
      :RK")'NETWOOW_UBLIC_FL+=("NEXT_Puired_vars ? 'reqontractsons.includeChis.opti{t    $   
 P_NAME")BLIC_AP"NEXT_PUODE_ENV" vars=("Nd_re requilocals
        red variablerequi Check      #
         ists"
  exment file ion environ"Productog_success  l  hen
     le" ]; tnv_fiif [ -f "$e"
    production".env.le=v_fi enalloc 
    "
   guration... confinmenting envirofo "Checkog_in) {
    lironment(k_envs
chec function}

# Check
LED++))(CHECKS_FAI$1"
    (IL]\${NC} \${RED}[FA "o -e  echor() {
  
log_err+))
}
NINGS+  ((WAR $1"
  \${NC}LOW}[WARN]YELo -e "\${    ech() {
_warning
log}
)
KS_PASSED++)
    ((CHEC1"} $[PASS]\${NC\${GREEN} -e "echo     {
s()uccesog_s"
}

l\${NC} $1[INFO]LUE}{Bo -e "\$) {
    echinfo(s
log_ng function# LoggiS=0

WARNINGAILED=0
0
CHECKS_FCKS_PASSED=CHEers


# Countlor # No Co\\033[0m'm'
NC='\\033[0;34E='[1;33m'
BLU033'\\m'
YELLOW=\\033[0;32
GREEN='33[0;31m'\\0
RED='tutpus for oolor

# Cet -ee}
sprojectNams.onhis.optiks for ${t checentdeploymsh

# Pre-!/bin/bascript = `#st  conig {
   neratedConfChecks(): GeploymentratePreDeivate gene  pr
   */
pt checks scrideploymentre-enerate p G /**
   *  }

 nt'
    }
ploymee: 'deconfigTyp      rkflow,
  code: wo.yml',
    oypllows/de/workf '.githube:enamfiln {
      
    returt
`
rip javascs:    languageth:
       wiyze@v2
   -action/analthub/codeql  uses: gialysis
    CodeQL Ann ame: Ru   - n
       moderate
  audit-level  --  npm audit     
 |:       runt
ecurity audiname: Run s-      
    4
 ckout@vactions/che uses: 
     kout codename: Chec - ps:
      ste
    
 quest'ull_reme == 'pvent_naf: github.e   ist
 ntu-late-on: ubu
    runsurity-scan:
  sec   ` : ''}
nds
 ent commaploymdef-hosted our sel # Add y    
   e"d happen hert woul deploymented "Self-hoscho   e     un: |
ver
      rserd stelf-hoy to se Deploame: - n
      
    .me}:latestectNaions.proj{this.opt-t $cker build do     run: ker image
 Build Docame:  - n `
   lf-hosted' ?rget === 'seymentTaions.deplohis.opt  ${t  
  : ''}
      ` TE_ID }}
Y_SIrets.NETLIFsec{{ _ID: \$TEFY_SIETLI  N}
      AUTH_TOKEN }LIFY_crets.NET \${{ se_AUTH_TOKEN:     NETLIFYenv:
   "
      b ActionsGitHum loy froon depuctige: "Proddeploy-messa     KEN }}
   GITHUB_TOecrets. s\${{b-token: ithu     g
   y: true-deplooduction        pr/out'
lish-dir: '.      pub  with:
  @v2.0
    etlify/actions-nes: nwtgck
      usion) (Productto Netlifyy me: Deplo   - nafy' ? `
 == 'netliet =rgploymentTas.options.de
    ${thi ''}
    ''}
    ` :n}` : customDomai.options.his{tins: $-domaasmain ? `alistomDoptions.cuthis.o       ${rod'
 '--prcel-args:   ve      }}
CT_ID OJEEL_PRVERC secrets.id: \${{ject-prorcel-ve  
      _ID }}EL_ORGsecrets.VERC-id: \${{ el-org  verc      }}
 TOKENVERCEL_${{ secrets.l-token: \verce  ith:
        won@v25
    actinet/vercel-ses: amond     uction)
 l (Produce Veroy toepl D - name:`
    ? ercel''vtTarget === ymenptions.deplo   ${this.o
       h all
ction.stimize-produ/scripts/op    run: .  tions
 optimizauctione: Run prod 
    - nam     --prod
e ckfil --frozen-lollpnpm insta    run: ies
  ncde depenme: Install na 
    - }}
       NPM_VERSION.P env{{ersion: \$  v      with:
  tup@v2
    /action-sepm: pn
      usesup pnpm name: Set -
   }}
        _VERSION .NODE{{ envon: \$ node-versi
             with:node@v4
tup-ctions/sees: a     uss
 de.j: Setup No
    - name@v4
      s/checkoutaction uses:      out code
 Check    - name:  steps:
    
  
  rcel.app'}e + '.veprojectNamis.options.Domain || th.customthis.options://${l: https   ur   oduction
   name: prent:
      environm
 in'
    ads/ma'refs/hethub.ref ==  if: gi
   ntu-lateston: uburuns-    eds: test
n:
    ney-productio deplo` : ''}

 
    ID }}ITE_FY_Srets.NETLI sec\${{: LIFY_SITE_ID NET       TOKEN }}
TH_.NETLIFY_AUsecretsOKEN: \${{ Y_AUTH_TLIF     NET
   
      env:b Actions" from GitHueploy "Dssage:deploy-me     EN }}
   _TOKrets.GITHUB \${{ secithub-token:  gin
       mabranch:ction-   produut'
     ir: './oh-d  publish:
      it
      w.0v2netlify@actions-tgck/uses: nw
      (Staging)y oy to Netlif- name: Depl`
    netlify' ? === 'Target s.deploymentthis.option   
    ${: ''}
  ` 
   ercel.appName}.vons.projectopti-${this.tagingdomains: s   alias-    aging'
 ODE_ENV=st Nnvgs: '--ear    vercel- }}
    OJECT_IDL_PRs.VERCEcret \${{ set-id:cel-projec     ver_ID }}
   RCEL_ORGsecrets.VE${{  \g-id:l-or      verceOKEN }}
  _Ts.VERCELecretn: \${{ svercel-tokeh:
             wit
 v25ction@rcel-a amondnet/ve     uses:ing)
 el (Stagloy to Vercname: Dep   - rcel' ? `
  'vet ===oymentTarges.deplionthis.opt 
    ${t@v4
     heckouns/cio act      uses:out code
 name: Check -   steps:
 
   
      el.apptName}.vercns.projecthis.optioing-${tag://s url: https  ng
   name: stagi      :
ntme   environ  
   op'
vel/de/heads== 'refsthub.ref 
    if: gi-lateston: ubuntuuns-test
    reeds: g:
    ntaginoy-sdepl
  ABLED: 1
RY_DISXT_TELEMET      NEon
  V: producti NODE_EN     
      env:m build
  n: pnp      ru
ationild applic Bu   - name:
   : ''}
    test
    `ODE_ENV:
        N env:  -run
    test -: pnpmrunts
       Run tes - name:
   ing ? `ns.testoptio   ${this.
 mit
      --noE tsc un: pnpm
      rgckinche Run type name:   - 
 lint
      un: pnpm g
      rRun lintin    - name:     

  ckfilelozen-ll --fro pnpm insta      run:s
encieepende: Install d
    - nam       -store-
   os }}-pnpmrunner.${{  \|
         tore-keys: res    }}
     ml')lock.yapm-**/pnes('Fil hash-store-\${{.os }}-pnpm runner\${{ ey:     k }}
   v.STORE_PATH{{ enath: \$
        p    with:che@v3
  ns/ca: actio  uses cache
     pnpmup - name: Set    
   _ENV
    ITHUB$G" >> \h --silent)atpnpm store pE_PATH=\$(ORho "ST  ec    run: |
  bash
      hell:      sory
 irect dnpm store name: Get p  
    -    ON }}
  SIenv.PNPM_VER: \${{ ion       vers:
      withtup@v2
 m/action-se  uses: pnppm
     pn: Setup   - name
        
 SION }}ODE_VER{{ env.Nversion: \$   node-ith:
     @v4
      w/setup-nodeses: actions
      uup Node.jsname: Set -       
   kout@v4
actions/chec    uses: t code
   Checkou   - name:ps:
 
    stest
    ateuntu-lns-on: ub    ru:

  test'

jobs:SION: '8
  PNPM_VERON: '18'ERSI  NODE_V ]

env:
ains: [ mbrancheest:
    ull_requop ]
  pin, devel: [ manches   bra
 n:
  push:}

oectNametions.projoploy ${this.= `name: Deporkflow 
    const wig {eneratedConf(): GHubActionsgenerateGit private 
 
   */uration configons CI/CDtiitHub Ac* Generate G/**
   
  

  }    }eployment'
'dgType:  confi  t,
   de: scrip cosh',
     oduction.optimize-prs/iptame: 'scr
      filen{rn 
    retu
`
@"n "$

mai  esac
}     ;;
  
         exit 1
          mizations"un all opti      - R  all     echo "      t"
    eploymenr depare fo  - Prprepare     "ho  ec
           "imizationsformance opt perplye - Apformancper       echo "       zations"
timicurity opy sepl    - Apityho "  secur        ecsize"
    ze bundle    - Analyalyze  "  anho ec            "
atic assetsmize st      - Opti"  assets echo             process"
 buildptimize- O    "  build    echo           :"
 "Commandso        ech"
     "o     ech
        pare|all}"remance|purity|perforlyze|secanald|assets| $0 {bui "Usage: echo      
       *)  ;;
             yment
   _deplo   prepare         nce
_performaptimize          o
  izationscurity_optimsepply_        a
    ize_assetsptim    o  d
      ze_builtimiop            ll")
        "a    ;;
  
      "$2"eployment   prepare_d
          ")repa"pre     
    ;;          
 ncerformaize_pe       optim)
     e"anc  "perform    
            ;;s
  ation_optimizty_securi    apply        ecurity")
     "s  ;;
          e
   ze_bundl      analy    
  lyze")"ana;
          ;          ze_assets
timi         op")
   sets  "as;;
                  ze_build
   optimi      d")
   il "bu
       " in1"$ case () {
   
mainonxecuti
# Main efi
}
urn 1
         retng"
   fore deployiiew bend, revsues fou️  Some is echo "⚠se
           el0
    return   
  !"nt deployme🎉 Ready for "echo      then
   d -ge 4 ];_passe [ $checksif
    
    passed"cks checks _che/$totaledchecks_passs: $nesent readiploymho "📊 De    
    eci
  f  d"
renfigu co notrseade h  Security"⚠️    echo   else
    d++))
  asses_pcheck       ((igured"
 ers confty heado "✅ Securi        echull; then
/ndevg.mjs 2>/fit.connexeaders" grep -q "h    if configured
 headers 5: Securityck   # Che  fi
    
uded"
     may be inclndenciesepeevelopment d  Dcho "⚠️      e
  se   el
 s_passed++))  ((check     
 d" passe checknciespendeelopment de"✅ Dev      echo ]; then
  n" "productio= " !E_ENVOD"$N| [ e.json |" packag\\"ependencies\\"devD"f ! grep -q  iction
   in producies dependent elopmen dev4: No   # Check fi
    
 und"
     fonotkage.json o "❌ Pac
        ech
    else_passed++))checks   ((  "
   oundon fe.jsckagPa   echo "✅      then
; .json" ]"package[ -f if xists
    kage.json e3: Pac  # Check    
  i
 "
    fgured confint not environmeon❌ Producti "     echo  lse
  e  
 sed++))_pascks ((che
       figured"ment contion environ Produccho "✅     e    then
" ];ductionenv.pro".  if [ -f ables
  ment vari2: Environck Che
    # 
     fi  
  not found"acts Build artif  echo "❌lse
        essed++))
  ((checks_pa        
ts found"tifacuild ar echo "✅ B
        then ];dist"] || [ -d "" "out|| [ -d ".next" ]  if [ -d 
   ifacts existrtuild a Check 1: B   #
    
 ecks=5total_ch
    local passed=0cal checks_  
    loss..."
  nent readioymeg deplalidatinho "🔍 Vess
    ecment readinployidate de Val
    
    #
    fint.tar.gz"-deploymerojectName}s.options.p${thiated: creage cknt paloymecho "✅ Dep        e
        
modulese_=nodxclude --e   
         : ''} \\.mjs'ext.config? 'n'next' amework === ions.frthis.opt     ${\\
       ge.json  packa         \
   public \
            \\ .next        
   " \\.gz.tareploymente}-dtNamprojecoptions.is.-czf "${thar    t   n
   ]; thekage"= "pac"$1" 
    if [ kageloyment paceate dep
    # Cr."
    ployment..g for de"🎯 Preparinecho nt() {
    loymepare_deparation
prent preploymeDep
#     fi
}

erated"txt gen✅ Robots. echo "OF
       ml
Etemap.xpp'}/siel.aerctName + '.vs.projecoptionis. || thustomDomainoptions.cps://${this.tt
Sitemap: hlow: /
nt: *
Al
User-ages.txt << EOFpublic/robot      cat > 
  hen" ]; tts.txt"public/robo ! -f if [
    .txttsboGenerate ro
    #   fi
    erated"
  emap geno "✅ Sit  echp
      xt-sitemapx ne       nen
 .js" ]; thmap.config"next-site if [ -fed)
    configurs xt-sitemap imap (if nete site # Genera   
   "
 ..mizations.optierformance  Applying p echo "⚡() {
   ancermtimize_perfo
opionsoptimizatce orman# Perf fi
}

   und"
t fot file noenvironmenProduction    echo "❌     else
   fi
    "
      ent file in environmecteda detdatensitive  "⚠️  Sho ec      en
     ion; thuctod" .env.prt\\|key\\|secreord -q "passwif grep    es
     filonmentirata in env dsitiveck for senhe   # C      
   
    "ndile fount fronmeon envi Producti"✅cho     en
    ; then" ]roductio.penv[ -f ".
    if sblet variae environmen   # Validat
    
 
    fi"lities foundlnerabivu  Security o "⚠️te || echoderalevel mt --audit-audi pnpm        hen
 t/null 2>&1;devd -v pnpm >/man comif
    rabilitiesty vulnesecurieck for   
    # Ch"
  s...optimizationy uritplying sec"🔒 Ap echo 
   s() {timizationcurity_op
apply_seizationsity optim
# Securfi
}
    "
ednot configuralyzer e an"⚠️  Bundl  echo           else
eted"
lysis complundle anaho "✅ B
        ec pnpm buildNALYZE=true  A    ; then
  kage.json pacer"dle-analyzt/bun"@nex ep -q] && gre.json" ckag-f "pa   if [ 
    size..."
 undle alyzing bo "📊 An  ech
  _bundle() {analyzes
le analysi
# Bundfi
}
  "
  ion optimizatipping SVGe, skvailabl  svgo not a echo "⚠️e
       
    els" optimized"✅ SVGscho    evgo
      sargs| xg"  "*.svname public -     find   then
 v/null 2>&1;>/ded -v svgo   if commanable)
   is avail(if svgoSVGs imize 
    # Opt    fi
"
    pressionimage comipping  skt available,noimagemin "⚠️      echo 
    "
    elsedsseges compreecho "✅ Ima  
      -dir=publicoutmagemin --| xargs i*.jpeg"  -name ".jpg" -ome "*" -o -nae "*.pnglic -namnd pub      fihen
  &1; tll 2>ev/nun >/d imagemicommand -v   if lable)
 min is avai(if images ges imampres    # Co  
ets..."
  g ass️  Optimizin   echo "🖼ts() {
 assee_timizizations
opset optimAs
# }
ted"
tion completimizaild opcho "✅ Bu    e}
    
od'pm build:pr 'pn' : 'pnpm buildnext' ?rk === '.framewothis.optionsns
    ${mizatioh optiBuild wit    #  
ile
   rozen-lockfod --fprstall --
    pnpm inies onlyon dependencoductill prInsta   # t
    
 ist out d-rf .nex  rm uilds
  s blean previou C   #."
    
 ss..ld procetimizing buiho "📦 Op
    ecuild() {ptimize_bations
old optimiz
# Bui
Y_DISABLED=1T_TELEMETRrt NEXon
expo=productiE_ENVxport NODup
e setvironment# Enns..."

timizatiooduction opplying prho "🚀 Apet -e

ece}
sectNamojs.proptionr ${this.t fo scriptimizationction oproduh

# P#!/bin/bas `nst script =  coConfig {
  atedGeners(): mizationOptiioncteProdute generativa
   */
  pronszatiimific optecition-sperate produc   * Gen
  /**

  }
 }t'
   loymengType: 'dep      confi
g,code: confi      ',
.mjsroductionig.pext.confename: 'n  filn {
       retur
 nfig
`
= nextCole.exports }
}

modu'1.0.0',
  n || age_versiopacknpm_v.s.enSION: procesC_VERT_PUBLIEXng(),
    N).toISOStriE: new Date(UILD_TIMPUBLIC_B NEXT_nv: {
   
  elesnment variab  // Enviro },

 config
 rn   retu}

     '}
 ' ` : true
     nimize =ion.mizatnfig.optimi`
      coion ? bleMinificatzations.ena{optimi   
      $
   ''} : 
      `seffects = faln.sideEimizatioptnfig.o
      cos = truedExportmization.useti   config.opng ? `
   Shaki.enableTreetionsptimiza{
      ${o if (!dev) ons
   ati optimizoduction    // Pr{
er }) =>  isServg, { dev,ck: (confiebpa wations
 imizpack opt
  // Web  ]
  },
      }
  ent: true
  perman  /',
    ion: ' destinat      '/home',
 ource:    s
      {urn [
     {
    retedirects() ync rrects
  asedi  // R


  },   ]
      }
         ]      }
gin'
    ss-orihen-crogin-wstrict-ori    value: '      y',
  rrer-Polic key: 'Refe   {
                    },
 
       ode=block'ue: '1; m       val    n',
 ioS-ProtectXSey: 'X- k                  {
 },
   
         e: 'DENY'    valu        
ions','X-Frame-Opt:          key
             {    },
      sniff'
no: 'value      ,
      ons'ptipe-Oontent-Ty'X-C   key:               {
        },
'
       preloadubDomains; ludeS0; inc6307200age=lue: 'max-         va
   Security',Transport-'Strict-       key: 
              {   },
 n'
       : 'o      value
      ntrol',ch-Cofetreey: 'X-DNS-P  k                   {
eaders: [
        h
 '/(.*)',ource: {
        sn [
      tur) {
    reeaders(  async hrs
rity heade  // Secu

,
  ` : ''}
  }) } config
         return
)
      )     },
   lyzer: true     openAnae,
     led: tru     enab))({
     e-analyzer'/bundlire('@nextqu(re     new   push(
 plugins.fig.
      con=> {onfig) k: (c   webpac&& {
 'true' === NALYZE nv.Ass.e...(procezer ? `
  lynaions.bundleAptimizat
  ${opment only) (develozernaly// Bundle a
  '}
: 'e,
  ` truompress: 
  csion ? `leCompresions.enabizat  ${optimpression
 
  // Com: ''}
 ," lone'put: 'standaout "ration ?eStaticGeneons.enablzatiptimi
  ${ofigurationtput con
  // Ou
  },
ed: true,'}unoptimiz ' :   `",
 ox;andbrc 'none'; script-src 'self'; sdefault-s"y: ityPolicntentSecur
    corue,yAllowSVG: trousl,
    dangeTL: 60inimumCacheT   mif'],
 ', 'image/ave/webpmats: ['imag for
   ation ? `ptimizageObleImions.enatimizat
    ${op  images: {
ization optimImage//   },

  ` : ''}

     false,
    } :rn']rror', 'waude: ['ecl     ex
 tion' ? {=== 'produc_ENV ss.env.NODEnsole: proceeCo    remov
ication ? `enableMinifons.ati   ${optimizer: {
 pil
  comptimizationsCompiler o  // },

''}
  r' }," : rrol: 'e: { logLeveotrace "turb ?ingakableTreeShations.en${optimiz    '}
" : 'ue,imizeCss: trng ? "optCodeSplittions.enableatiimiz${opt  cons'],
  -ui/react-iadixact', '@rde-rets: ['luciImporePackage    optimizimental: {

  experionsptimizaterformance o {
  // PtConfig = nex/
constConfig} *'next').Nextport(ype {im* @t}

/*ectNameions.projs.opthir ${ttion fouraon configptimizati`// Build onfig = nst co

    co    }r: false
dleAnalyze
      buntion: true,ticGenerableSta
      enarue,mization: tbleImageOpti
      enating: true,plitleCodeSenab
      rue,eShaking: tTre     enableue,
 sion: treCompresblena,
      ion: trueaticMiniflenab  e
    nfig = {Cotimizationns: BuildOpatioonst optimiz   c{
 ratedConfig Geneonfig(): ptimizationCildOeBue generat  privaton
   */
rationfigution cptimizaild o buGenerate  * 

  /**
   }
  }oyment'
  pligType: 'de  conffile,
    kerdoc    code: file',
  ocker'Dename:       filturn {
re
    r.js"]
`
, "servenode""n
CMD [ applicatio
# Start.0.0"
ME "0.0ENV HOSTNART 3000
PO

ENV POSE 3000
EXose port# Exp nextjs

sions
USERct permis# Set corre

ictatext/stic ./.np/.next/stader /apuilom=b --fr
COPYne ./dalonext/stanp/.builder /apom=Y --frpublic
COP.//app/public lder --from=buin
COPY t applicatiobuily 
# Cops
 1001 nextj--uider --system N addus1 nodejs
RUem --gid 100 --systRUN addgroupser
oot ureate non-rED=1

# CY_DISABLETR NEXT_TELEM
ENVroductionODE_ENV=ppp

ENV NRKDIR /aWOnner
 AS rupine18-alFROM node:er
3: Runnge ta# S

uild pnpm bon
RUNcatiBuild appli
# =1
_DISABLEDXT_TELEMETRY
ENV NEuctionodprNODE_ENV=
ENV environmentSet build # 

COPY . .
_modulesdees ./nomodulp/node_rom=deps /apPY --fdencies
COdepen

# Copy ll -g pnpmUN npm install pnpm
R

# InstaORKDIR /appr
We AS buildede:18-alpinder
FROM notage 2: Buil

# S --prodfilefrozen-lockll --insta
RUN pnpm yaml* ./m-lock.npckage.json pes
COPY package fil
# Copy papnpm
stall -g N npm inll pnpm
RUta
# Ins/app
DIR pat
WORK libc6-comno-cache --ddpk a a
RUNe AS depsin-alpFROM node:18encies
1: DependStage 
# me}
s.projectNahis.option${tor ker build fti-stage DocMulle = `#  dockerfi
    constonfig { GeneratedCfig():teDockerCongenera
  private nt
   */deploymehosted lf-for seuration ker configte Doc
   * Genera
  /**  }

    }
yment''deploe: Typ config,
      config      code:
y.toml', 'netlifname:file
         return {
 

` : ''}e = true
`  forc = 301
  statusplat"
mDomain}/:ssto.cu.optionss://${thiso = "http
  tapp/*"e}.netlify..projectNam.options//${thism = "https:ts]]
  fro`
[[redirecmDomain ? ions.custos.optn
${thiuratioigonfin cma# Custom do : ''}

 = 200
`atusstplat"
  s/:sctionfuny/.netlif = "/
  toapi/*" = "/
  fromredirects]]`
[[ncludeAPI ? ions.i
${this.opttions)y Funclifh Net routes witAPIg Next.js usin(if I routes 

# APs = 301  statu"
"/ = 
  to"/home"rom = ]]
  fdirectsrerects
[["

# Redinross-origiigin-when-ctrict-ory = "sicrrer-Pol   Refe"
 ock"1; mode=bl= n rotectio    X-XSS-P "DENY"
-Options =   X-Framef"
  "nosnif =ptionstent-Type-Oones]
    X-C.valu[headers"
  r = "/*]]
  foheadersecurity
[[eaders for s"

# HvelopmentV = "deLIC_APP_ENT_PUBent"
  NEXopmNV = "develE_Ent]
  NODenvironmeploy.dech-ntext.bran
[co''}

  ` : org"nflow.st-testnet.ohttps://re = "NODECESS_IC_FLOW_ACEXT_PUBLet"
  Nstnte "_NETWORK =C_FLOW_PUBLI
  NEXTracts ? `deConts.incluis.option}"
  ${thjectNameprons..optio${this_NAME = "APPPUBLIC_T_g"
  NEXagin_ENV = "stIC_APP  NEXT_PUBL
 "staging"  NODE_ENV =onment]
ew.envirloy-previt.depntex

[co
  ` : ''}flow.org"mainnet.onttps://rest-"hESS_NODE = _ACC_PUBLIC_FLOWEXT
  Nmainnet"K = "W_NETWORLIC_FLO  NEXT_PUBs ? `
tractudeConclptions.in ${this.o: ''}
 }"` omDomaintions.custhis.op"https://${t= _APP_URL LICT_PUBomain ? `NEXustomD.cthis.options  ${ectName}"
options.proj= "${this._NAME IC_APPEXT_PUBL"
  NoductionV = "prUBLIC_APP_EN
  NEXT_Pproduction" = "NODE_ENV
  t]nmenn.enviroproductiotext.ntexts
[concoifferent or dvariables fnt 
# Environme"
LED = "1TRY_DISAB NEXT_TELEMEll"
 dev/nuix=/--pref_FLAGS = ""
  NPMION = "18VERSnt]
  NODE_nvironmeld.e

[bui|| 'out'}"ory rectutDi.outp.options "${thispublish =uild'}"
  pnpm b || 'dCommandptions.buils.ond = "${thi
  comma[build]e}

ctNamons.proje.opti{thision for $figuratoyment contlify depl Ne = `#igonfonst c
    cdConfig {): GenerateifyConfig(Netl generaterivate  p/
on
   *nfiguraticot ploymen Netlify dete   * Genera

  /**
}
    }
  deployment'gType: '    confiull, 2),
  fig, nify(con JSON.string     code:l.json',
 ame: 'verce
      filenn {
    retur    }
  })
xtjs'
    : 'ne  framework
       && {xt' === 'neameworkptions.fr.(this.o     ..      ],
 
e
        }ent: tru   perman  
      '/',tion:estina  d,
        /home'e: 'ourc        s      {
  
  ects: [  redir
    
      ],   }        ]
    }
           in'
    ighen-cross-ort-origin-w'stric value:         ,
     rer-Policy' 'Referkey:             
       {  },
               k'
 e=bloc mode: '1;   valu         
  rotection','X-XSS-P      key:                {
    
         },DENY'
    ue: 'val           s',
   ionme-Optey: 'X-Fra      k        {
   ,
             }'
        nosniff: ' value          ons',
   -Type-Optiontentey: 'X-C k            
     {     
   aders: [          he)',
rce: '/(.*        sou
  { [
        ers:head         },
        }
  
 ration: 30    maxDu    .ts': {
  /**/*/apiapp{
        'functions: },
           })
  rg'
       .onflow.ost-mainnets://rehttpDE: '_ACCESS_NOPUBLIC_FLOW NEXT_         ainnet',
WORK: 'm_NETLOWPUBLIC_F   NEXT_        {
&&s ractContludeoptions.incthis.      ...(n',
  tio 'producLIC_APP_ENV:UBT_P
        NEXe,ctNamptions.projethis.oME: C_APP_NAEXT_PUBLI       N
    env: {   },
       }
   {})
    s || tVariablenmenrooptions.envithis.     ...(
      '1',RY_DISABLED:LEMETT_TEEX         N   env: {
 
        build: {,
   ain] })customDomtions..op [thiss:& { aliamain &mDostos.cuonopti(this.,
      ...mes.projectNahis.optioname: t2,
      nion: 
      versonfig = {t c
    cons{nfig  GeneratedCocelConfig():teVereneraate giv
   */
  prrationguent conficel deploymer Generate V
   * /**
   }
   }
ployment'
 pe: 'de  configTy  fig,
  con:  code     NFIG.md',
NMENT_CONVIROme: 'docs/Eilena{
      fturn   re.0
`

  ION=1.0_VERSPUBLICng()}
NEXT_SOStri).toIe(ew Dat${nILD_TIME=\_PUBLIC_BUXTation
NEd Configur'}

# Builcommain.our-doN=ySTOM_DOMAIC_CUBLIPUNEXT_ain}` : '# customDomoptions.MAIN=${this.DOTOM_T_PUBLIC_CUS `NEXmain ?omDotions.custthis.opration
${guomain Confim D

# Custo_idanalyticsICS_ID=your_ ANALYTy_dsn
#N=your_sentrSENTRY_DSvices
# y Ser Third-partpp_url

#our_aURL=yAUTH_XTret
# NEextauth_secour_n=yTAUTH_SECRET
# NEXh.js)xtAuting Ne(if usn iothenticat

# Auion_stringconnectse_taba_da_URL=yourABASEATneeded)
# Dration (if ase Configu# Databre'}

_api_key_he=your_API_KEYe
` : '# AI_api_key_herr_anthropic_KEY=you_APIOPIC# ANTHRre
pi_key_he_a=your_geminiI_API_KEY_ARATIVELE_GENE
# GOOGherepi_key_our_openai_aEY=y_API_KPENAI
# Oider:ne AI prov Choose odeAPI ? `
#ptions.inclus.oity)
${thionalti API funcford on (requiretiguraer ConfirovidAI P
# t files)
ironmeniate envroprpps (add to ablearial Vnatio}

# Addi\n')\`
).join('}

\\\n')}\`).join('y}=\${valueke) => \`\${ value]y,map(([keies(vars).ntr\${Object.eeded

mize as nesto cu\${env} and to .env.# Copy
onmente()} EnviroUpperCas${env.t`## \) => 
  \, vars]s).map(([envnvConfigentries(eObject.

${t stagesymeneplorent dor diffelates fmple tent variabronmeontains enviis file c# Themplates
iguration Tment Confnviron= `# Enst config  }

    co      }
 ue'
  NG: 'trE_MONITORIRMANCFOENABLE_PER
        'false',GING: QUEST_LOG ENABLE_RE
       arn','wOG_LEVEL: ,
        L  })     
 nflow.org't.o/rest-mainneps:/ttS_NODE: 'hW_ACCES_PUBLIC_FLO   NEXT
        'mainnet',ETWORK:UBLIC_FLOW_N   NEXT_P     cts && {
  cludeContraons.inopti..(this.       .',
 ionroductENV: 'pUBLIC_APP_EXT_P        N\`,
rcel.app'}e + '.vectNamprojeis.options.n || th.customDomaithis.options//\${L: \`https:IC_APP_URUBL    NEXT_Pame,
    .projectNthis.optionsPP_NAME: C_ALIXT_PUB
        NE '1',ED:ABLMETRY_DIS NEXT_TELE
       ,on'producti 'NODE_ENV:{
        duction:       pro
      },
G: 'true'RINNITOANCE_MOLE_PERFORM        ENAB',
NG: 'trueT_LOGGIBLE_REQUES        ENA'info',
L: LOG_LEVE     
           }),rg'
.olowtnet.onf-tesrestE: 'https://CCESS_NODBLIC_FLOW_A  NEXT_PU     net',
   TWORK: 'testNEC_FLOW_  NEXT_PUBLI
        {ts && ontrac.includeChis.options  ...(tg',
      agin 'st_ENV:PUBLIC_APP    NEXT_   
 `,rcel.app\jectName}.ve.options.prohisg-\${taginhttps://st\`L: C_APP_URUBLI     NEXT_Pe,
   Namrojectons.phis.optiAME: tLIC_APP_NUBXT_PNE     
   LED: '1',TRY_DISABT_TELEMENEX',
        'stagingNODE_ENV:     g: {
    in
      stag  },rue'
    TORING: 'tE_MONI_PERFORMANCABLEEN    ,
    GING: 'true'_LOGABLE_REQUEST  EN      'debug',
 L:OG_LEVE
        L     }),true'
   _MODE: 'C_MOCKUBLIT_P   NEX       ,
g'et.onflow.or-testn/resthttps:/_NODE: 'W_ACCESSUBLIC_FLOEXT_P  N,
        testnet'ORK: 'ETWLOW_NT_PUBLIC_F       NEX   s && {
eContractions.includ...(this.opt    nt',
     'developmeP_ENV:_PUBLIC_AP  NEXT     
 :3000',lhostp://locaL: 'httBLIC_APP_URPUEXT_ Ne,
       Namojectons.proptiis._NAME: thUBLIC_APP     NEXT_P,
   ED: '1'Y_DISABLMETR NEXT_TELE
       ment',evelopV: 'd_EN       NODE{
 t: evelopmen     d {
 tConfig =enEnvironm: t envConfigsns  coonfig {
  : GeneratedCtConfigs()vironmenenerateEnate g privs
   */
 t stageferens for difgurationnment confinvirorate e* Gene
     /**


  }
    }nt'e: 'deploymeTyp    configanager,
  code: m',
      -manager.shcripts/envfilename: 's {
       return

    "$@"
`c
}

main esa;;
         
       exit 1           how_usage
     s           *)
 ;;
           files
      list_env_   ")
             "list;
           ;2.enc"
   e ".env.$ypt_env_fil   decri
           f
                exit 1
            show_usage          
     required"meironment nanvror "E      log_er         " ]; then
 z "$2 [ -         if
   decrypt") "    ;;
             $2"
  v.e ".en_filenvrypt_   enci
               fit 1
      ex          e
      how_usag          s"
      equired rnameronment vig_error "En  lo           then
   ; "$2" ] [ -z      if
       )"encrypt"      
       ;;
       2" "$3"_vars "$  sync_env             fi
         exit 1
              ge
  _usa      show      red"
    ents requivironmtarget enand e ourcerror "S       log_     
    3" ]; thenz "$| [ -] |" if [ -z "$2            
")"sync      ;;
        "
      ".env.$2nv_vars   validate_e         i
        f       exit 1
             ge
  show_usa        d"
       ame requireonment nor "Envirg_err   lo         en
    "$2" ]; th   if [ -z        )
  idate"   "val;
      ;      "
     mplate "$2te_env_copy              fi
          
     exit 1         _usage
    show         "
     e requirednamnvironment r "E  log_erro           then
   $2" ]; if [ -z "        nit")
         "i1" in
     case "${
  ain() r
mandlen command h
# Maii
}
s)"
    foverride(local .env.local cho "  📝         e" ]; then
".env.local-f 
    if [ .env.localeck for # Ch
    
       done       fi
 ound)"
  f_file (noto "  ❌ $env     ech    else
          )"
 odified: $m, modifiedize bytessize: $sfile ($env_"  ✅      echo    )
    own""unknecho ll || 2>/dev/nu" nv_file -c%y "$eull || stat/dev/nfile" 2>env_"$stat -f%Sm ied=\$(odif     local m")
        "unknown || echoev/null" 2>/dnv_file-c%s "$e stat /dev/null ||e" 2>"$env_fil -f%z \$(state=sizocal      l
        then" ];ilef "$env_f    if [ -nv"
    $ev.".enal env_file=        loc do
ENTS[@]}";{ENVIRONM in "\$env  for ject:"
  s in proent filenmiro"Env  log_info  {
  _env_files()es
listonment filt envir
}

# Lis"inglopment stag$0 sync deve"  o     echduction"
ate pro0 valid  $ho "
    ecent" developm "  $0 inithoec  
  ples:"o "Exam  echo ""
  ech"
    roduction pging,ment, staopvelnts: deonmenvir "E echo"
     echo ""
  ment files all environ   List           "  list  
    echo ile"nvironment ft e Decryp      ecrypt <env>cho "  d"
    et fileonmenenvirypt    Encrpt <env>     "  encry  echo
  ironments"nvs between ele variab    Sync <from> <to>"  synco  ech
   es"ment variabldate environli    Vanv>   validate <echo " ate"
    eemplle from tent fie environm   Initializ     v>  nit <en  echo "  i"
  :o "Commands   echo ""
 
    ech" [options]nd><commaage: $0 echo "Us) {
    age(how_ushow usage
s
}

# S 1
    firn        retuypt"
ot decr, cannablePG not avail"Gerror        log_  else
 ile"
  _f $env decrypted:fileEnvironment g_success "     lole"
   fid_"$encryptele"  "$env_fiuttpecrypt --oupg --d     gthen
   ull 2>&1; ev/n-v gpg >/df command     i fi
    
n 1
       retur
    d_file"rypte found: $encotile nEncrypted fg_error "      lo ]; then
  ile"encrypted_ff [ ! -f "$  
    i.enc}"
  ed_file%encrypte="\${v_fil en
    locale="$1"crypted_filocal en
    l) {t_env_file(crypdet file
 environmencrypt De
#   fi
}
n"
 ng encryptioppi, ski available noting "GPGog_warn
        l
    else"_fileyptedpted: $encrile encry fEnvironment "_success    log  ile"
  nv_file" "$ecrypted_f"$en-output AES256 -er-algo ciphmetric --gpg --sym      hen
   t1;v/null 2>&gpg >/deommand -v 
    if c 
    fi
    1    return    "
$env_file not found: t filenmen "Envirororerog_   lthen
     le" ]; _fi"$envif [ ! -f   
    "
  enc"$env_file.ted_file=local encryp1"
    ="$ileal env_f  loc  le() {
t_env_fi
encrypfilent ironmeitive envrypt sens
}

# Encssfully"nced succeles synment variabEnviroess "log_succ
    
    ile"source_f "$ne <  do  fi
  
         fi    
     _file" "$target>>o "$line"         ech             else
     t_file"
  "$targene/" /$li$var_name=.*sed -i "s/^                ull; then
>/dev/n" 2arget_fileme=" "$tar_na -q "^$v grep         if
   t filetargein d variable  or adpdate       # U     
           ne#*=}"
 {lie="\$cal var_valu      lo*}"
      ${line%%=="\r_namelocal va         
   thenern ]]; lude_patt~ $exce =in! $l && [[ =.* ]]-Z_]+ine =~ ^[A $l [[      ifdo
   -r line; = readwhile IFS 
    
   L)="URATABASE__URL|DAPPNEXT_PUBLIC_ENV|ODE_ttern="^(Ne_pal exclud)
    locaific onesent-specronmuding enviclurce (exs from sod variable    # Rea
    
target_env" $ce_env torom $sours fnt variableg environmeo "Syncin
    log_inf
        fiturn 1
        re"; then
e_filesourcnv_file "$_e  if ! check"
    
  get_envtar.env.$_file=" targetlocal"
    ce_envenv.$sourle=".l source_fi loca"
   v="$2rget_enlocal ta1"
    ="$ source_env    local
s() {nc_env_varn files
sytweeiables benment var Sync enviro}

#
sac ;;
    e     
      get_file"/' "$tarercel.app'}ctName + '.vions.proje| this.optomain |.customDoptionsis.\/${th/\:\\tpsRL=htUBLIC_APP_URL=.*/NEXT_PLIC_APP_UXT_PUBi 's/NE     sed -   )
    duction"       "pro  ;;
          "
 rget_filetael.app/' "$e}.vercprojectNamns.${this.optiong-stagi\/\\/URL=https:\APP_EXT_PUBLIC_L=.*/NPP_URBLIC_AT_PU -i 's/NEX sed         _file"
  "$target' aging//NODE_ENV=stuctionENV=prod/NODE_ 's   sed -i)
         g"instag"         ;;
           
_file"target00/' "$localhost:30/\\/\tp:\APP_URL=htIC_/NEXT_PUBL_URL=.*UBLIC_APPT_P/NEXd -i 's          sele"
  arget_fi$t' "development/NV=tion/NODE_EENV=produc's/NODE_d -i   se       nt")
   developme   "   v" in
  arget_en$t   case "
 c valuest-specifironmen envi   # Update    
 "
atemplfile from te $target_ "Createdccess   log_su
 rget_file""$talate_file" p "$temp    
    cfi
    fi
        0
   return "
         fileget_ping $tar"Skiplog_info             n
$ ]]; the~ ^[Yy] ! $REPLY = [[       ifho
   ec   1 -r
   : " -n write? (y/N)ver "Oread -p    "
    et_files: $targexistalready e filvironment rning "Enwag_    lo; then
    e" ]"$target_fil   if [ -f    
     fi
 urn 1
    ret
    "le$template_fi:  not foundile fTemplate_error "og  l
      thenfile" ]; late_! -f "$tempf [    i 
 
   get_env"".env.$tarle=fial target_loc   xample"
 ".env.ee_file=mplat tecal   lo$1"
 env="get_al tar  loc() {
  plate_env_tem
copyemplatevironment t Copy en0
}

#   return present"
 ables are arironment vuired envireqss "All cceg_su    
    lo
    fi
rn 1 retue
        don"
       - $var"       echo  do
       rs[@]}";missing_va\${n " for var i     
  ariables:"nt vnvironme ered requisingor "Misog_err   l     ]; then
  -gt 0ng_vars[@]}missi{# [ \$ if    
      done
   fi
    )
  ar"=("$vvars+ssing_        mithen
    >/dev/null;  2e"v_filr=" "$en^$va " ! grep -q    if"; do
    ]}s[@equired_varin "\${rr var     fo()
ing_vars= local miss
        /**

   * Generate environment variable management system
   */
  private generateEnvironmentManager(): GeneratedConfig {
    const manager = `#!/bin/bash

# Environment Variable Management System for ${this.options.projectName}
set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Environment configurations
ENVIRONMENTS=("development" "staging" "production")

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "\${BLUE}[INFO]\${NC} $1"
}

log_success() {
    echo -e "\${GREEN}[SUCCESS]\${NC} $1"
}

log_warning() {
    echo -e "\${YELLOW}[WARNING]\${NC} $1"
}

log_error() {
    echo -e "\${RED}[ERROR]\${NC} $1"
}

# Check if environment file exists
check_env_file() {
    local env_file="$1"
    if [ ! -f "$env_file" ]; then
        log_error "Environment file not found: $env_file"
        return 1
    fi
    return 0
}

# Validate environment variables
validate_env_vars() {
    local env_file="$1"
    local required_vars=("NEXT_PUBLIC_APP_NAME" "NEXT_PUBLIC_FLOW_NETWORK")
    
    ${this.options.includeContracts ? 'required_vars+=("NEXT_PUBLIC_FLOW_ACCESS_NODE")' : ''}
    ${this.options.includeAPI ? 'required_vars+=("OPENAI_API_KEY")' : ''}
    
    log_info "Validating environment variables in $env_file"
    
    local missing_vars=()
    for var in "\${required_vars[@]}"; do
        if ! grep -q "^$var=" "$env_file" 2>/dev/null; then
            missing_vars+=("$var")
        fi
    done
    
    if [ \${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables:"
        for var in "\${missing_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    
    log_success "All required environment variables are present"
    return 0
}

# Copy environment template
copy_env_template() {
    local target_env="$1"
    local template_file=".env.example"
    local target_file=".env.$target_env"
    
    if [ ! -f "$template_file" ]; then
        log_error "Template file not found: $template_file"
        return 1
    fi
    
    if [ -f "$target_file" ]; then
        log_warning "Environment file already exists: $target_file"
        read -p "Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping $target_file"
            return 0
        fi
    fi
    
    cp "$template_file" "$target_file"
    log_success "Created $target_file from template"
    
    # Update environment-specific values
    case "$target_env" in
        "development")
            sed -i 's/NODE_ENV=production/NODE_ENV=development/' "$target_file"
            sed -i 's/NEXT_PUBLIC_APP_URL=.*/NEXT_PUBLIC_APP_URL=http:\\/\\/localhost:3000/' "$target_file"
            ;;
        "staging")
            sed -i 's/NODE_ENV=production/NODE_ENV=staging/' "$target_file"
            sed -i 's/NEXT_PUBLIC_APP_URL=.*/NEXT_PUBLIC_APP_URL=https:\\/\\/staging-${this.options.projectName}.vercel.app/' "$target_file"
            ;;
        "production")
            sed -i 's/NEXT_PUBLIC_APP_URL=.*/NEXT_PUBLIC_APP_URL=https:\\/\\/${this.options.customDomain || this.options.projectName + '.vercel.app'}/' "$target_file"
            ;;
    esac
}

# Main command handler
main() {
    case "$1" in
        "init")
            if [ -z "$2" ]; then
                log_error "Environment name required"
                exit 1
            fi
            copy_env_template "$2"
            ;;
        "validate")
            if [ -z "$2" ]; then
                log_error "Environment name required"
                exit 1
            fi
            validate_env_vars ".env.$2"
            ;;
        *)
            echo "Usage: $0 {init|validate} <environment>"
            exit 1
            ;;
    esac
}

main "$@"
`

    return {
      filename: 'scripts/env-manager.sh',
      code: manager,
      configType: 'deployment'
    }
  }

  /**
   * Generate environment configurations for different stages
   */
  private generateEnvironmentConfigs(): GeneratedConfig {
    const config = `# Environment Configuration Templates
# This file contains environment variable templates for different deployment stages

## DEVELOPMENT Environment
# Copy to .env.development and customize as needed

NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_NAME=${this.options.projectName}
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
${this.options.includeContracts ? `
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_MOCK_MODE=true
` : ''}
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true

## STAGING Environment
# Copy to .env.staging and customize as needed

NODE_ENV=staging
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_NAME=${this.options.projectName}
NEXT_PUBLIC_APP_URL=https://staging-${this.options.projectName}.vercel.app
NEXT_PUBLIC_APP_ENV=staging
${this.options.includeContracts ? `
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
` : ''}
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true

## PRODUCTION Environment
# Copy to .env.production and customize as needed

NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_NAME=${this.options.projectName}
NEXT_PUBLIC_APP_URL=https://${this.options.customDomain || this.options.projectName + '.vercel.app'}
NEXT_PUBLIC_APP_ENV=production
${this.options.includeContracts ? `
NEXT_PUBLIC_FLOW_NETWORK=mainnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-mainnet.onflow.org
` : ''}
LOG_LEVEL=warn
ENABLE_REQUEST_LOGGING=false
ENABLE_PERFORMANCE_MONITORING=true

# Additional Variables (add to appropriate environment files)

# AI Provider Configuration (required for API functionality)
${this.options.includeAPI ? `
# Choose one AI provider:
# OPENAI_API_KEY=your_openai_api_key_here
# GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
` : '# AI_API_KEY=your_api_key_here'}

# Database Configuration (if needed)
# DATABASE_URL=your_database_connection_string

# Authentication (if using NextAuth.js)
# NEXTAUTH_SECRET=your_nextauth_secret
# NEXTAUTH_URL=your_app_url

# Third-party Services
# SENTRY_DSN=your_sentry_dsn
# ANALYTICS_ID=your_analytics_id

# Custom Domain Configuration
${this.options.customDomain ? `NEXT_PUBLIC_CUSTOM_DOMAIN=${this.options.customDomain}` : '# NEXT_PUBLIC_CUSTOM_DOMAIN=your-domain.com'}

# Build Configuration
NEXT_PUBLIC_BUILD_TIME=${new Date().toISOString()}
NEXT_PUBLIC_VERSION=1.0.0
`

    return {
      filename: 'docs/ENVIRONMENT_CONFIG.md',
      code: config,
      configType: 'deployment'
    }
  }

  /**
   * Generate Vercel deployment configuration
   */
  private generateVercelConfig(): GeneratedConfig {
    const config = {
      version: 2,
      name: this.options.projectName,
      ...(this.options.customDomain && { alias: [this.options.customDomain] }),
      build: {
        env: {
          NEXT_TELEMETRY_DISABLED: '1',
          ...(this.options.environmentVariables || {})
        }
      },
      env: {
        NEXT_PUBLIC_APP_NAME: this.options.projectName,
        NEXT_PUBLIC_APP_ENV: 'production',
        ...(this.options.includeContracts && {
          NEXT_PUBLIC_FLOW_NETWORK: 'mainnet',
          NEXT_PUBLIC_FLOW_ACCESS_NODE: 'https://rest-mainnet.onflow.org'
        })
      },
      functions: {
        'app/api/**/*.ts': {
          maxDuration: 30
        }
      },
      headers: [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff'
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY'
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block'
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin'
            }
          ]
        }
      ],
      redirects: [
        {
          source: '/home',
          destination: '/',
          permanent: true
        }
      ],
      ...(this.options.framework === 'next' && {
        framework: 'nextjs'
      })
    }

    return {
      filename: 'vercel.json',
      code: JSON.stringify(config, null, 2),
      configType: 'deployment'
    }
  }

  /**
   * Generate build optimization configuration
   */
  private generateBuildOptimizationConfig(): GeneratedConfig {
    const config = `// Build optimization configuration for ${this.options.projectName}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    optimizeCss: true,
    turbotrace: { logLevel: 'error' },
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Output configuration
  output: 'standalone',
  
  // Compression
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      }
    ]
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      config.optimization.minimize = true
    }

    return config
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_VERSION: process.env.npm_package_version || '1.0.0',
  }
}

module.exports = nextConfig
`

    return {
      filename: 'next.config.production.mjs',
      code: config,
      configType: 'deployment'
    }
  }

  /**
   * Generate production-specific optimizations
   */
  private generateProductionOptimizations(): GeneratedConfig {
    const script = `#!/bin/bash

# Production optimization script for ${this.options.projectName}
set -e

echo "🚀 Applying production optimizations..."

# Environment setup
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Build optimizations
optimize_build() {
    echo "📦 Optimizing build process..."
    
    # Clean previous builds
    rm -rf .next out dist
    
    # Install production dependencies only
    pnpm install --prod --frozen-lockfile
    
    # Build with optimizations
    ${this.options.framework === 'next' ? 'pnpm build' : 'pnpm build:prod'}
    
    echo "✅ Build optimization completed"
}

# Main execution
main() {
    case "$1" in
        "build")
            optimize_build
            ;;
        "all")
            optimize_build
            ;;
        *)
            echo "Usage: $0 {build|all}"
            exit 1
            ;;
    esac
}

main "$@"
`

    return {
      filename: 'scripts/optimize-production.sh',
      code: script,
      configType: 'deployment'
    }
  }