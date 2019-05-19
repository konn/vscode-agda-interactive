start = !header msg:message eol  { msg.kind = 0; return [msg] }
      / bs:(block *) { return [].concat(...bs) }

block = kind:header msgs:message* eol
  { msgs.map(e => e["kind"] = kind); return msgs }

header = ("----" / "————") [ \t]+
  kind:("Warning" "(s)"? { return 1 }
       /"Error" "(s)"? {return 0 } )
  [\t ]* "—"+ eol
  { return kind }
  
path = ".lagda" / ".agda" / l:[^\n\r] r:path { return l.concat(r) }

number = n:[0-9]+ { return parseInt(n.join("")) }
pos =
  line:number col:("," r:number {return r} )?
  { return {line: line, column: col || 0 } }

location =
  ![ \t\r\n]+
  path:path ":" ran:range
  eol
  { ran.file = path; return ran }

range =
  beg:pos
    end:("-" el:(n:number "," {return n})? ec:number
         { return el ? {line: el, column: ec } : {line:beg.line, column: ec}}
        )?
        { return {begin: beg, end: end || beg}  }

message_line = !location line:[^\r\n]+ eol { return line.join("") }

message = 
  loc:location msgs:message_line*
  { return { location: loc, message: msgs.join("\n") } }

eol = [\r\n] / !.

