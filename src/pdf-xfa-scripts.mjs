import {normalizeXFAValues} from './pdf-xfa-state.mjs';

// XFA expressions are interpreted as data. Document code never receives browser objects.
const PRECEDENCE=new Map([['||',1],['or',1],['&&',2],['and',2],['==',3],['===',3],['!=',3],['!==',3],['eq',3],['ne',3],['<>',3],['=',3],['<',4],['<=',4],['>',4],['>=',4],['lt',4],['le',4],['gt',4],['ge',4],['&',2],['|',1],['+',5],['-',5],['*',6],['/',6],['%',6]]);
const FUNCTIONS=new Set(['Sum','Avg','Min','Max','Count','Round','Abs','Ceil','Floor','Pow','Mod','If','Concat','Len','Upper','Lower','Num','Number','parseFloat','parseInt','String','Math.abs','Math.ceil','Math.floor','Math.round','Math.min','Math.max','Math.pow','xfa.resolveNode','xfa.resolveNodes']);
function tokenize(source,formcalc){
 if(typeof source!=='string'||source.length>8000)throw Error('Script exceeds 8,000 characters.');
 const tokens=[];let i=0;
 while(i<source.length){
  const rest=source.slice(i),space=/^\s+/.exec(rest);if(space){i+=space[0].length;continue}
  if(formcalc&&rest[0]===';'||rest.startsWith('//')){const end=source.indexOf('\n',i);i=end<0?source.length:end+1;continue}
  if(rest.startsWith('/*')){const end=source.indexOf('*/',i+2);if(end<0)throw Error('Unclosed script comment.');i=end+2;continue}
  if(rest[0]==='"'||rest[0]==="'"){
   const quote=source[i++];let value='',closed=false;
   while(i<source.length){let c=source[i++];if(c===quote){if(formcalc&&source[i]===quote){i++;value+=quote;continue}closed=true;break}if(c==='\\'){const escaped=source[i++],escapes={n:'\n',r:'\r',t:'\t',"'":"'",'"':'"','\\':'\\'};if(!Object.hasOwn(escapes,escaped))throw Error('Unsupported string escape.');c=escapes[escaped]}value+=c}
   if(!closed)throw Error('Unclosed script string.');tokens.push({type:'literal',value});
  }else{
   const number=/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest),name=/^[A-Za-z_$][\w$]*/.exec(rest),operator=/^(?:===|!==|==|!=|<>|<=|>=|&&|\|\||[+\-*/%<>=!&|?:.,;()[\]{}])/.exec(rest);
   if(number){tokens.push({type:'literal',value:Number(number[0])});i+=number[0].length}
   else if(name){tokens.push({type:'name',value:name[0]});i+=name[0].length}
   else if(operator){tokens.push({type:'symbol',value:operator[0]});i+=operator[0].length}
   else throw Error('Unsupported script syntax.');
  }
  if(tokens.length>3000)throw Error('Script is too complex.');
 }
 tokens.push({type:'end',value:'<end>'});return tokens;
}
function compile(source,formcalc){
 const tokens=tokenize(source,formcalc);let i=0,depth=0,nodes=0;
 const peek=()=>tokens[i].value,take=value=>tokens[i].type!=='literal'&&peek()===value?(i++,true):false,expect=value=>{if(!take(value))throw Error('Expected '+value+'.')},node=value=>{if(++nodes>2000)throw Error('Script is too complex.');return value};
 function expression(minimum=0){
  if(++depth>64)throw Error('Script nesting exceeds 64 levels.');let left;
  const token=tokens[i++];
  if(token.type==='literal')left=node({type:'literal',value:token.value});
  else if(['+','-','!','not'].includes(token.value))left=node({type:'unary',op:token.value,value:expression(7)});
  else if(token.value==='('){left=expression();expect(')')}
  else if(['true','false','null'].includes(token.value))left=node({type:'literal',value:token.value==='null'?null:token.value==='true'});
  else if(token.type==='name'){
   const path=[{name:token.value,index:null}];
   while(peek()==='.'||peek()==='['){if(take('.')){if(tokens[i].type!=='name')throw Error('Expected a field name.');path.push({name:tokens[i++].value,index:null})}else{expect('[');const index=tokens[i++];if(index.value!=='*'&&(index.type!=='literal'||!Number.isInteger(index.value)||index.value<0||index.value>5000))throw Error('Unsupported field index.');path.at(-1).index=index.value;expect(']')}}
   left=node({type:'reference',path});
   if(take('(')){const name=path.map(part=>part.name).join('.');if(path.some(part=>part.index!==null)||!FUNCTIONS.has(name))throw Error('Unsupported function '+name+'.');const args=[];if(!take(')')){do{args.push(expression())}while(take(','));expect(')')}left=node({type:'call',name,args});if(take('.')){expect('rawValue');if(!['xfa.resolveNode','xfa.resolveNodes'].includes(name))throw Error('Unsupported function property.')}}
  }else throw Error('Expected a script expression.');
  while(tokens[i].type!=='literal'&&PRECEDENCE.has(peek())&&PRECEDENCE.get(peek())>=minimum){const op=peek();if(!formcalc&&['&','|'].includes(op))throw Error('Bitwise operators are unsupported.');if(op==='='&&!formcalc)break;i++;left=node({type:'binary',op,left,right:expression(PRECEDENCE.get(op)+1)})}
  if(minimum===0&&take('?')){const yes=expression();expect(':');left=node({type:'conditional',condition:left,yes,no:expression()})}depth--;return left;
 }
 function statements(stop=new Set(['<end>'])){
  if(++depth>64)throw Error('Script nesting exceeds 64 levels.');const body=[];
  while(tokens[i].type==='literal'||!stop.has(peek())){
   if(take(';'))continue;
   if(take('if')){
    expect('(');const condition=expression();expect(')');let yes,no=[];
    if(formcalc){expect('then');yes=statements(new Set(['else','endif']));if(take('else'))no=statements(new Set(['endif']));expect('endif')}
    else{expect('{');yes=statements(new Set(['}']));expect('}');if(take('else')){expect('{');no=statements(new Set(['}']));expect('}')}}
    body.push(node({type:'if',condition,yes,no}));continue;
   }
   if(take('var')||take('let')||take('const')){const name=tokens[i++];if(name.type!=='name')throw Error('Expected a local variable.');expect('=');body.push(node({type:'local',name:name.value,value:expression()}));take(';');continue}
   if(take('return')){body.push(node({type:'return',value:expression()}));take(';');continue}
   // Assignment is recognized before FormCalc's expression-level equality operator.
   const start=i;let target;try{const first=tokens[i++];if(first.type==='name'){const path=[{name:first.value,index:null}];while(take('.')){if(tokens[i].type!=='name')break;path.push({name:tokens[i++].value,index:null})}if(take('='))target={type:'reference',path}}}finally{if(!target)i=start}
   if(target)body.push(node({type:'assign',target,value:expression()}));else body.push(node({type:'expression',value:expression()}));take(';');
  }
  depth--;return body;
 }
 return statements();
}
function number(value){if(Array.isArray(value))throw Error('A calculation expected a single value.');if(value===null||value==='')return 0;const result=Number(value);if(!Number.isFinite(result))throw Error('A calculation expected a finite number.');return result}
function bounded(value){if(typeof value==='number'&&!Number.isFinite(value)||typeof value==='string'&&value.length>4000)throw Error('A calculation produced an unsupported value.');return value}
function pathText(path){return path.map(part=>part.name+(part.index===null?'':'['+part.index+']')).join('.')}

export function createXFAScriptRuntime(metadata,schema){
 const byName=new Map(),programs=[],warnings=new Set();let sourceSize=0;
 for(const field of metadata||[]){
  if(!field||typeof field.id!=='string'||!Array.isArray(field.path)||field.path.length>100)continue;
  if(!schema.has(field.id)&&(field.scripts||[]).length){warnings.add('Scripts on hidden or unavailable fields are unsupported.');continue}
  const name=field.path.at(-1)?.name;if(!byName.has(name))byName.set(name,[]);byName.get(name).push(field);
  for(const script of field.scripts||[]){
   sourceSize+=script.source?.length||0;if(sourceSize>250000||programs.length>1000)throw Error('XFA scripts exceed the supported size.');
   const label=field.path.map(part=>part.name).join('.')||'Field';
   try{
    if(script.runAt==='server')throw Error('Server scripts are not available locally.');
    if(!['calculate','initialize','change','exit','enter'].includes(script.activity))throw Error('Unsupported '+script.activity+' event.');
    const formcalc=['','application/x-formcalc'].includes(script.language);if(!formcalc&&!['application/x-javascript','text/javascript'].includes(script.language))throw Error('Unsupported script language.');
    const ast=compile(script.source,formcalc),entry=schema.get(field.id);if(script.activity==='calculate'&&(entry?.kind!=='text'||entry.incompatible||entry.unsupported||field.id===field.fieldId))throw Error('This calculated field has an unsupported binding or value type.');
    if(!entry)continue;programs.push({field,activity:script.activity,ast,formcalc,label});if(script.activity==='calculate'){entry.calculated=true;entry.editable=false}
   }catch(error){warnings.add(label+': '+error.message)}
  }
 }
 function run(input,{activity=null,fieldId=null}={}){
  let values=normalizeXFAValues(input),budget=150000;
  const tick=(cost=1)=>{budget-=cost;if(budget<0)throw Error('XFA calculations exceeded their work limit.')};
  function execute(program){
   const before=values;values={...values};const locals=new Map(),context=program.field;let last=null,returned=false,selfAssigned=false;
   function resolve(path){
    tick();path=path.filter((part,index)=>!(index===0&&['$form','xfa'].includes(part.name)));if(path[0]?.name==='form')path=path.slice(1);
    if(['this','$'].includes(path[0]?.name)){if(path.length===1||path.length===2&&path[1].name==='rawValue')return [context];throw Error('Unsupported current-field property.')}
    if(path.at(-1)?.name==='rawValue')path=path.slice(0,-1);if(!path.length)throw Error('Missing field reference.');
    const candidates=byName.get(path.at(-1).name)||[];tick(candidates.length);const match=(candidate,prefix)=>{const full=[...prefix,...path];return full.length===candidate.path.length&&full.every((part,index)=>part.name===candidate.path[index].name&&(part.index==='*'||part.index===null&&candidate.path[index].index===0||part.index===candidate.path[index].index))};
    for(let length=context.path.length-1;length>=0;length--){const matches=candidates.filter(candidate=>match(candidate,context.path.slice(0,length)));if(matches.length)return matches}
    throw Error('Unknown field '+pathText(path)+'.');
   }
   function read(field){const value=Object.hasOwn(values,field.id)?values[field.id]:field.value??'';return field.numeric?number(value):value}
   function reference(path){
    if(path.length===1&&locals.has(path[0].name))return locals.get(path[0].name);
    if(pathText(path)==='xfa.event.newText')return read(context);
    const matches=resolve(path),value=matches.map(read);if(matches.length>1&&!path.some(part=>part.index==='*'))throw Error('Ambiguous field reference.');return path.some(part=>part.index==='*')?value:value[0];
   }
   function call(name,args){
    if(['xfa.resolveNode','xfa.resolveNodes'].includes(name)){
     if(args.length!==1||typeof args[0]!=='string'||args[0].length>512)throw Error('Unsupported field lookup.');
     const path=args[0].replace(/^\$form\./,'').split('.').map(part=>{const match=/^([A-Za-z_$][\w$]*)(?:\[(\d+|\*)\])?$/.exec(part);if(!match)throw Error('Unsupported field lookup.');return {name:match[1],index:match[2]==='*'?'*':match[2]===undefined?null:Number(match[2])}}),matches=resolve(path);if(name==='xfa.resolveNode'&&matches.length!==1)throw Error('Ambiguous field lookup.');return name==='xfa.resolveNodes'?matches.map(read):read(matches[0]);
    }
    const flat=args.flat();tick(flat.length);const numbers=()=>flat.filter(value=>value!==null&&value!=='').map(number);
    switch(name){
     case 'Sum':return numbers().reduce((a,b)=>a+b,0);
     case 'Avg':{const n=numbers();return n.length?n.reduce((a,b)=>a+b,0)/n.length:0}
     case 'Min':case 'Math.min':return Math.min(...numbers());
     case 'Max':case 'Math.max':return Math.max(...numbers());
     case 'Count':return flat.filter(value=>value!==null&&value!=='').length;
     case 'Abs':case 'Math.abs':return Math.abs(number(args[0]));
     case 'Ceil':case 'Math.ceil':return Math.ceil(number(args[0]));
     case 'Floor':case 'Math.floor':return Math.floor(number(args[0]));
     case 'Round':{const digits=number(args[1]??0);if(!Number.isInteger(digits)||Math.abs(digits)>12)throw Error('Unsupported rounding precision.');const factor=10**digits;const value=number(args[0]);return Math.sign(value)*Math.round(Math.abs(value)*factor)/factor}
     case 'Math.round':return Math.round(number(args[0]));
     case 'Pow':case 'Math.pow':return number(args[0])**number(args[1]);
     case 'Mod':return number(args[0])%number(args[1]);
     case 'Concat':return flat.map(value=>value??'').join('');
     case 'Len':return String(args[0]??'').length;
     case 'Upper':return String(args[0]??'').toUpperCase();
     case 'Lower':return String(args[0]??'').toLowerCase();
     case 'Num':case 'Number':return number(args[0]);
     case 'parseFloat':return parseFloat(String(args[0]));
     case 'parseInt':if(args.length>1&&args[1]!==10)throw Error('Only decimal parsing is supported.');return parseInt(String(args[0]),10);
     case 'String':return String(args[0]??'');
     default:throw Error('Unsupported function.');
    }
   }
   function evaluate(ast){
    tick();switch(ast.type){
     case 'literal':return ast.value;
     case 'reference':return reference(ast.path);
     case 'conditional':return evaluate(ast.condition)?evaluate(ast.yes):evaluate(ast.no);
     case 'call':if(ast.name==='If'){if(ast.args.length!==3)throw Error('If requires three arguments.');return evaluate(ast.args[0])?evaluate(ast.args[1]):evaluate(ast.args[2])}return bounded(call(ast.name,ast.args.map(evaluate)));
     case 'unary':{const value=evaluate(ast.value);return ast.op==='!'||ast.op==='not'?!value:ast.op==='-'?-number(value):number(value)}
     case 'binary':{
      const a=evaluate(ast.left);if(['&&','and','&'].includes(ast.op))return a&&evaluate(ast.right);if(['||','or','|'].includes(ast.op))return a||evaluate(ast.right);const b=evaluate(ast.right);
      switch(ast.op){case '+':return bounded(program.formcalc?number(a)+number(b):a+b);case '-':return number(a)-number(b);case '*':return bounded(number(a)*number(b));case '/':return bounded(number(a)/number(b));case '%':return bounded(number(a)%number(b));case 'eq':case '=':case '==':return a==b;case '===':return a===b;case 'ne':case '<>':case '!=':return a!=b;case '!==':return a!==b;case 'lt':case '<':return a<b;case 'le':case '<=':return a<=b;case 'gt':case '>':return a>b;case 'ge':case '>=':return a>=b;default:throw Error('Unsupported operator.')}
     }
     default:throw Error('Unsupported expression.');
    }
   }
   function write(path,value){
    bounded(value);if(path.length===1&&locals.has(path[0].name)){locals.set(path[0].name,value);return}
    const targets=resolve(path);if(targets.length!==1)throw Error('An assignment must target one field.');const target=targets[0],entry=schema.get(target.id);
    if(!entry?.editable&&!(entry?.calculated&&target.id===context.id))throw Error('A script tried to change a protected field.');
    if(entry.kind!=='text')throw Error('Script assignment supports text and numeric fields only.');if(Array.isArray(value))throw Error('Cannot assign a list to a scalar field.');
    Object.defineProperty(values,target.id,{value:String(value??''),enumerable:true,writable:true,configurable:true});if(target.id===context.id)selfAssigned=true;
   }
   function statements(body){for(const statement of body){tick();if(returned)break;switch(statement.type){case 'if':statements(evaluate(statement.condition)?statement.yes:statement.no);break;case 'local':locals.set(statement.name,bounded(evaluate(statement.value)));break;case 'assign':last=evaluate(statement.value);write(statement.target.path,last);break;case 'return':last=evaluate(statement.value);returned=true;break;default:last=evaluate(statement.value)}}}
   try{statements(program.ast);if(program.activity==='calculate'&&!selfAssigned){if(program.formcalc)write([{name:'this',index:null}],last);else throw Error('The calculation did not assign its field value.')}values=normalizeXFAValues(values)}catch(error){values=before;throw Error(program.label+': '+error.message)}
  }
  for(const program of programs)if(program.activity===activity&&(!fieldId||program.field.fieldId===fieldId))execute(program);
  const calculated=programs.filter(program=>program.activity==='calculate');
  if(calculated.length){let settled=false;for(let pass=0;pass<20;pass++){const previous=JSON.stringify(values);for(const program of calculated)execute(program);if(JSON.stringify(values)===previous){settled=true;break}}if(!settled)throw Error('XFA calculations did not settle after 20 passes.')}
  return values;
 }
 return {run,warnings:[...warnings],hasCalculations:programs.some(program=>program.activity==='calculate'),hasPrograms:programs.length>0};
}
