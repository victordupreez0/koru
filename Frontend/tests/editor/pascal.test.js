import { runPascal } from "../../src/components/editor/runtime/pascal";

// Wraps statements in a main program.
const main = (body, decls = "") => `program Test;\n${decls}\nbegin\n${body}\nend.`;
const out = (src, opts) => {
  const r = runPascal(src, opts);
  if (r.error) throw new Error(`Unexpected error: ${r.error.message}`);
  return r.stdout;
};
const err = (src, opts) => {
  const r = runPascal(src, opts);
  if (!r.error) throw new Error(`Expected an error, got output: ${r.stdout}`);
  return r.error;
};

describe("basics", () => {
  test("hello world with the usual Delphi header", () => {
    const src = `program Hello;\n{$APPTYPE CONSOLE}\n{$R *.res}\nuses\n  System.SysUtils;\nbegin\n  WriteLn('Hello, world!');\n  ReadLn;\nend.`;
    expect(runPascal(src)).toEqual({ stdout: "Hello, world!\n", error: null });
  });

  test("a bare begin..end with no final dot, and comments of every kind", () => {
    expect(out("begin\n  // line\n  { brace }\n  (* star *)\n  writeln('ok')\nend")).toBe("ok\n");
  });

  test("keywords and names are case-insensitive", () => {
    expect(out("VAR iX: INTEGER;\nBEGIN ix := 4; WRITELN(IX * 2); END.")).toBe("8\n");
  });

  test("never throws, even for junk input", () => {
    expect(() => runPascal(null)).not.toThrow();
    expect(runPascal("").error).not.toBeNull();
    expect(runPascal("begin end.", null)).toEqual({ stdout: "", error: null });
  });

  test("Write and WriteLn with several arguments, booleans and empty WriteLn", () => {
    expect(out(main("Write('a', 1, 'b'); WriteLn; WriteLn(True, ' ', False); WriteLn(2.5);"))).toBe("a1b\nTRUE FALSE\n2.5\n");
  });

  test("string literals with doubled quotes and char codes", () => {
    expect(out(main("WriteLn('it''s'); WriteLn('a'#13#10'b'); WriteLn(#65#66);"))).toBe("it's\na\nb\nAB\n");
  });

  test("variables start at zero, empty and False", () => {
    expect(out(main("WriteLn(i, '[', s, ']', b, r);", "var i: Integer; s: String; b: Boolean; r: Real;"))).toBe("0[]FALSE0\n");
  });

  test("ShowMessage prints its text and a newline", () => {
    expect(out(main("ShowMessage('Done ' + IntToStr(3));"))).toBe("Done 3\n");
  });

  test("global const, typed const array and initialised var", () => {
    const decls = "const MAX = 3; NAME = 'Koru';\n  DAYS: array[1..3] of String = ('Mon', 'Tue', 'Wed');\nvar iStart: Integer = 10;";
    expect(out(main("WriteLn(MAX, NAME, DAYS[2], iStart);", decls))).toBe("3KoruTue10\n");
  });
});

describe("arithmetic", () => {
  test("precedence, div, mod and real division", () => {
    expect(out(main("WriteLn(2 + 3 * 4); WriteLn((2 + 3) * 4); WriteLn(17 div 5, ' ', 17 mod 5); WriteLn(7 / 2); WriteLn(8 / 4); WriteLn(-7 div 2, ' ', -7 mod 2); WriteLn(-2 * -3);"))).toBe("14\n20\n3 2\n3.5\n2\n-3 -1\n6\n");
  });

  test("reals print in short natural form", () => {
    expect(out(main("WriteLn(0.1 + 0.2); WriteLn(10 / 3); WriteLn(Pi); WriteLn(1.5e3);"))).toBe("0.3\n3.33333333333333\n3.14159265358979\n1500\n");
  });

  test("boolean operators with Pascal precedence", () => {
    expect(out(main("x := 5; WriteLn((x > 1) and (x < 10)); WriteLn(not (x = 5) or (x = 5)); WriteLn(True xor True); WriteLn(x in [1, 5, 9], ' ', 'c' in ['a'..'z']);", "var x: Integer;"))).toBe("TRUE\nTRUE\nFALSE\nTRUE TRUE\n");
  });

  test("and/or short-circuit", () => {
    expect(out(main("x := 0; if (x <> 0) and (10 div x > 1) then WriteLn('no') else WriteLn('safe');", "var x: Integer;"))).toBe("safe\n");
  });

  test("Round uses banker's rounding; Trunc, Int, Frac, Abs, Sqr, Sqrt, Power, Max, Min", () => {
    expect(out(main("WriteLn(Round(2.5), Round(3.5), Round(-2.5), Round(2.6)); WriteLn(Trunc(-3.7), ' ', Int(3.7), ' ', Frac(3.75)); WriteLn(Abs(-4), Sqr(3), ' ', Sqrt(16), ' ', Power(2, 10)); WriteLn(Max(3, 9), Min(3, 9), ' ', Max(2.5, 1));"))).toBe("24-23\n-3 3 0.75\n49 4 1024\n93 2.5\n");
  });

  test("Ord, Chr, Odd, Inc, Dec, UpCase", () => {
    expect(out(main("i := 5; Inc(i); Inc(i, 10); Dec(i, 2); c := 'a'; Inc(c); WriteLn(i, Ord('A'), Chr(66), Odd(3), UpCase(c));", "var i: Integer; c: Char;"))).toBe("1465BTRUEB\n");
  });

  test("Random(n) stays in range", () => {
    const s = out(main("Randomize; ok := True; for i := 1 to 200 do begin n := Random(6) + 1; if (n < 1) or (n > 6) then ok := False; end; WriteLn(ok);", "var i, n: Integer; ok: Boolean;"));
    expect(s).toBe("TRUE\n");
  });
});

describe("strings", () => {
  test("string functions", () => {
    const body = [
      "s := 'Hello World';",
      "WriteLn(Length(s), ' ', Copy(s, 1, 5), ' ', Pos('World', s), ' ', Pos('x', s));",
      "WriteLn(UpperCase(s), ' ', LowerCase(s));",
      "WriteLn('[', Trim('  hi  '), ']', StringOfChar('*', 3));",
      "Delete(s, 1, 6); WriteLn(s); Insert('Big ', s, 1); WriteLn(s);",
      "WriteLn(IntToStr(42) + '!', StrToInt('17') + 1, ' ', StrToFloat('2.5') * 2, ' ', FloatToStr(0.5));",
      "WriteLn(s[1], ' ', BoolToStr(True, True), ' ', BoolToStr(False, True));",
      "s[1] := 'b'; WriteLn(s);",
    ].join("\n");
    expect(out(main(body, "var s: String;"))).toBe("11 Hello 7 0\nHELLO WORLD hello world\n[hi]***\nWorld\nBig World\n42!18 5 0.5\nB True False\nbig World\n");
  });

  test("char + char and string comparisons", () => {
    expect(out(main("WriteLn('a' + 'b'); WriteLn('apple' < 'banana', ' ', 'abc' = 'abc');"))).toBe("ab\nTRUE TRUE\n");
  });

  test("reverse a string", () => {
    const src = `function Reverse(s: String): String;
var i: Integer;
begin
  Result := '';
  for i := Length(s) downto 1 do
    Result := Result + s[i];
end;
begin
  WriteLn(Reverse('Delphi'));
end.`;
    expect(out(src)).toBe("ihpleD\n");
  });
});

describe("decisions", () => {
  test("if..then..else chains", () => {
    const src = main(`for m := 0 to 3 do begin
  iMark := m * 30;
  if iMark >= 80 then WriteLn('A')
  else if iMark >= 50 then WriteLn('Pass')
  else WriteLn('Fail');
end;`, "var m, iMark: Integer;");
    expect(out(src)).toBe("Fail\nFail\nPass\nA\n");
  });

  test("case with values, lists, ranges and else", () => {
    const src = main(`for i := 1 to 6 do
  case i of
    1: Write('one ');
    2, 3: Write('few ');
    4..5: Write('some ');
  else
    Write('many ');
  end;
WriteLn;
c := 'b';
case c of
  'a'..'m': WriteLn('first half');
else WriteLn('second half');
end;`, "var i: Integer; c: Char;");
    expect(out(src)).toBe("one few few some some many \nfirst half\n");
  });
});

describe("loops", () => {
  test("for to / downto, while and repeat", () => {
    const src = main(`for i := 1 to 3 do Write(i);
for i := 3 downto 1 do Write(i);
WriteLn;
i := 1;
while i < 100 do i := i * 2;
WriteLn(i);
i := 0;
repeat Inc(i); until i = 5;
WriteLn(i);
for c := 'a' to 'e' do Write(c);
WriteLn;`, "var i: Integer; c: Char;");
    expect(out(src)).toBe("123321\n128\n5\nabcde\n");
  });

  test("Break and Continue in all three loops", () => {
    const src = main(`for i := 1 to 10 do begin if i = 4 then Break; if i = 2 then Continue; Write(i); end;
WriteLn;
i := 0;
while True do begin Inc(i); if i mod 2 = 0 then Continue; if i > 7 then Break; Write(i); end;
WriteLn;
i := 0;
repeat Inc(i); if i = 2 then Continue; if i = 5 then Break; Write(i); until i >= 10;
WriteLn;`, "var i: Integer;");
    expect(out(src)).toBe("13\n1357\n134\n");
  });

  test("nested loops: a multiplication table", () => {
    const src = main("for r := 1 to 3 do begin for c := 1 to 3 do Write(r * c:4); WriteLn; end;", "var r, c: Integer;");
    expect(out(src)).toBe("   1   2   3\n   2   4   6\n   3   6   9\n");
  });
});

describe("input", () => {
  test("ReadLn echoes what was typed and converts by type", () => {
    const src = main(`Write('Name: '); ReadLn(sName);
Write('Age: '); ReadLn(iAge);
Write('Height: '); ReadLn(rHeight);
WriteLn(sName, ' is ', iAge + 1, ' next year and ', rHeight:0:2, ' m tall.');
ReadLn;`, "var sName: String; iAge: Integer; rHeight: Real;");
    expect(runPascal(src, { stdin: "Thabo\n15\n1.6\n" })).toEqual({
      stdout: "Name: Thabo\nAge: 15\nHeight: 1.6\nThabo is 16 next year and 1.60 m tall.\n",
      error: null,
    });
  });

  test("ReadLn(a, b) reads one line for each variable; Read works too", () => {
    expect(out(main("ReadLn(a, b); Read(c); WriteLn(a + b + c);", "var a, b, c: Integer;"), { stdin: "1\n2\n3" })).toBe("1\n2\n3\n6\n");
  });

  test("missing input stops with a clear message, keeping earlier output", () => {
    const r = runPascal(main("Write('Number: ');\nReadLn(x);\nWriteLn(x);", "var x: Integer;"));
    expect(r.stdout).toBe("Number: ");
    expect(r.error.message).toBe("The program asked for input, but there was nothing left to read. Add another line to the Input box.");
    expect(r.error.line).toBe(5);
  });

  test("a word where a number is needed", () => {
    expect(err(main("ReadLn(x);", "var x: Integer;"), { stdin: "abc" }).message).toContain("'abc' is not a valid whole number.");
    expect(err(main("ReadLn(x);", "var x: Real;"), { stdin: "abc" }).message).toContain("'abc' is not a valid number.");
    expect(err(main("x := StrToInt('12a');", "var x: Integer;")).message).toContain("'12a' is not a valid whole number.");
  });
});

describe("arrays", () => {
  test("1-D: sum, average and maximum", () => {
    const src = main(`for i := 1 to 5 do arr[i] := i * i;
iSum := 0; iMax := arr[1];
for i := 1 to 5 do begin
  iSum := iSum + arr[i];
  if arr[i] > iMax then iMax := arr[i];
end;
WriteLn(iSum, ' ', iMax, ' ', iSum / 5:0:1, ' ', Length(arr), Low(arr), High(arr));`, "var arr: array[1..5] of Integer; i, iSum, iMax: Integer;");
    expect(out(src)).toBe("55 25 11.0 515\n");
  });

  test("2-D both ways: row and column totals", () => {
    const src = main(`for r := 1 to 3 do
  for c := 1 to 4 do begin
    g[r, c] := r * 10 + c;
    h[r][c] := g[r, c];
  end;
for r := 1 to 3 do begin
  t := 0;
  for c := 1 to 4 do t := t + g[r, c];
  Write(t, ' ');
end;
WriteLn;
for c := 1 to 4 do begin
  t := 0;
  for r := 1 to 3 do t := t + h[r][c];
  Write(t, ' ');
end;
WriteLn;`, "var g: array[1..3, 1..4] of Integer; h: array[1..3] of array[1..4] of Integer; r, c, t: Integer;");
    expect(out(src)).toBe("50 90 130 \n63 66 69 72 \n");
  });

  test("dynamic arrays with SetLength, Length, Low and High", () => {
    const src = main(`SetLength(a, 3);
a[0] := 5; a[2] := 7;
SetLength(a, 4);
a[3] := 1;
for i := Low(a) to High(a) do Write(a[i], ' ');
WriteLn(Length(a));`, "var a: array of Integer; i: Integer;");
    expect(out(src)).toBe("5 0 7 1 4\n");
  });

  test("named array types, char indexes and copying fixed arrays", () => {
    const src = `type TList = array[1..3] of Integer;
var a, b: TList; counts: array['a'..'c'] of Integer; s: String; i: Integer;
begin
  a[1] := 1; b := a; b[1] := 99;
  WriteLn(a[1], ' ', b[1]);
  s := 'abcab';
  for i := 1 to Length(s) do Inc(counts[s[i]]);
  WriteLn(counts['a'], counts['b'], counts['c']);
end.`;
    expect(out(src)).toBe("1 99\n221\n");
  });

  test("bubble sort", () => {
    const src = `const N = 6;
var arr: array[1..N] of Integer = (5, 2, 9, 1, 5, 6);
    i, j, t: Integer;
begin
  for i := 1 to N - 1 do
    for j := 1 to N - i do
      if arr[j] > arr[j + 1] then
      begin
        t := arr[j];
        arr[j] := arr[j + 1];
        arr[j + 1] := t;
      end;
  for i := 1 to N do Write(arr[i], ' ');
  WriteLn;
end.`;
    expect(out(src)).toBe("1 2 5 5 6 9 \n");
  });

  test("linear and binary search functions", () => {
    const src = `type TArr = array[1..8] of Integer;
var a: TArr; i: Integer;

function LinearSearch(const arr: TArr; target: Integer): Integer;
var k: Integer;
begin
  Result := -1;
  for k := 1 to 8 do
    if arr[k] = target then
    begin
      Result := k;
      Exit;
    end;
end;

function BinarySearch(arr: TArr; target: Integer): Integer;
var lo, hi, mid: Integer; found: Boolean;
begin
  lo := 1; hi := 8; found := False; BinarySearch := -1;
  while (lo <= hi) and not found do
  begin
    mid := (lo + hi) div 2;
    if arr[mid] = target then begin found := True; BinarySearch := mid; end
    else if arr[mid] < target then lo := mid + 1
    else hi := mid - 1;
  end;
end;

begin
  for i := 1 to 8 do a[i] := i * 3;
  WriteLn(LinearSearch(a, 12), ' ', LinearSearch(a, 13), ' ', BinarySearch(a, 21), ' ', BinarySearch(a, 2));
end.`;
    expect(out(src)).toBe("4 -1 7 -1\n");
  });

  test("open array parameters", () => {
    const src = `function Total(const a: array of Integer): Integer;
var i: Integer;
begin
  Result := 0;
  for i := Low(a) to High(a) do Result := Result + a[i];
end;
var nums: array[1..4] of Integer; i: Integer;
begin
  for i := 1 to 4 do nums[i] := i;
  WriteLn(Total(nums));
end.`;
    expect(out(src)).toBe("10\n");
  });
});

describe("procedures and functions", () => {
  test("var parameters: swap, including array items", () => {
    const src = `procedure Swap(var a, b: Integer);
var t: Integer;
begin
  t := a; a := b; b := t;
end;
var x, y: Integer; arr: array[1..2] of Integer;
begin
  x := 1; y := 2; Swap(x, y); WriteLn(x, y);
  arr[1] := 7; arr[2] := 8; Swap(arr[1], arr[2]); WriteLn(arr[1], arr[2]);
end.`;
    expect(out(src)).toBe("21\n87\n");
  });

  test("value parameters do not change the caller", () => {
    const src = `procedure Change(n: Integer; s: String); begin n := 0; s := ''; end;
var x: Integer; t: String;
begin x := 5; t := 'keep'; Change(x, t); WriteLn(x, t); end.`;
    expect(out(src)).toBe("5keep\n");
  });

  test("recursive factorial, procedures called without brackets, Exit(value)", () => {
    const src = `function Factorial(n: Integer): Int64;
begin
  if n <= 1 then Exit(1);
  Result := n * Factorial(n - 1);
end;
procedure Line;
begin
  WriteLn('-----');
end;
begin
  Line;
  WriteLn(Factorial(5), ' ', Factorial(15));
  Line();
end.`;
    expect(out(src)).toBe("-----\n120 1307674368000\n-----\n");
  });

  test("nested routines see the outer locals; forward declarations", () => {
    const src = `procedure IsEven(n: Integer); forward;
procedure Outer;
var count: Integer;
  procedure Bump;
  begin
    Inc(count);
  end;
begin
  count := 0; Bump; Bump; WriteLn(count);
end;
procedure IsEven(n: Integer);
begin
  WriteLn(n mod 2 = 0);
end;
begin
  Outer;
  IsEven(4);
end.`;
    expect(out(src)).toBe("2\nTRUE\n");
  });

  test("classic algorithms: isolate digits, prime, GCD", () => {
    const src = `function SumDigits(n: Integer): Integer;
begin
  Result := 0;
  while n > 0 do
  begin
    Result := Result + n mod 10;
    n := n div 10;
  end;
end;

function IsPrime(n: Integer): Boolean;
var i: Integer;
begin
  Result := n > 1;
  for i := 2 to Trunc(Sqrt(n)) do
    if n mod i = 0 then
    begin
      Result := False;
      Break;
    end;
end;

function GCD(a, b: Integer): Integer;
begin
  if b = 0 then Result := a
  else Result := GCD(b, a mod b);
end;

var i: Integer;
begin
  WriteLn(SumDigits(4096));
  for i := 1 to 20 do
    if IsPrime(i) then Write(i, ' ');
  WriteLn;
  WriteLn(GCD(84, 36));
end.`;
    expect(out(src)).toBe("19\n2 3 5 7 11 13 17 19 \n12\n");
  });
});

describe("classes", () => {
  const learner = `type
  TLearner = class
  private
    fName: String;
    fMark: Integer;
  public
    constructor Create(sName: String; iMark: Integer);
    function GetName: String;
    function GetMark: Integer;
    procedure SetMark(iMark: Integer);
    function HasPassed: Boolean;
    function ToString: String; override;
  end;

constructor TLearner.Create(sName: String; iMark: Integer);
begin
  fName := sName;
  fMark := iMark;
end;

function TLearner.GetName: String;
begin
  Result := fName;
end;

function TLearner.GetMark: Integer;
begin
  Result := Self.fMark;
end;

procedure TLearner.SetMark(iMark: Integer);
begin
  fMark := iMark;
end;

function TLearner.HasPassed: Boolean;
begin
  Result := fMark >= 50;
end;

function TLearner.ToString: String;
var sResult: String;
begin
  if HasPassed then sResult := 'passed' else sResult := 'failed';
  Result := fName + ' (' + IntToStr(fMark) + ') ' + sResult;
end;
`;

  test("constructor, accessor, mutator and ToString", () => {
    const src = `${learner}
var objL: TLearner;
begin
  objL := TLearner.Create('Thabo', 45);
  WriteLn(objL.GetName, ' ', objL.GetMark);
  WriteLn(objL.ToString);
  objL.SetMark(72);
  WriteLn(objL.ToString);
  objL.Free;
end.`;
    expect(out(src)).toBe("Thabo 45\nThabo (45) failed\nThabo (72) passed\n");
  });

  test("an array of objects", () => {
    const src = `${learner}
var arrL: array[1..3] of TLearner; i, iBest: Integer;
begin
  arrL[1] := TLearner.Create('Ann', 60);
  arrL[2] := TLearner.Create('Ben', 85);
  arrL[3] := TLearner.Create('Cee', 30);
  iBest := 1;
  for i := 2 to 3 do
    if arrL[i].GetMark > arrL[iBest].GetMark then iBest := i;
  WriteLn('Best: ', arrL[iBest].GetName);
  for i := 1 to 3 do WriteLn(arrL[i].ToString);
end.`;
    expect(out(src)).toBe("Best: Ben\nAnn (60) passed\nBen (85) passed\nCee (30) failed\n");
  });

  test("an object that was never created", () => {
    const src = `${learner}
var objL: TLearner;
begin
  WriteLn(objL.GetName);
end.`;
    const line = src.split("\n").indexOf("  WriteLn(objL.GetName);") + 1;
    const e = err(src);
    expect(e.message).toBe(`Line ${line}: This object was never created. Call Create first.`);
    expect(e.line).toBe(line);
  });

  test("private fields cannot be reached from outside the class", () => {
    const e = err(`${learner}
var objL: TLearner;
begin
  objL := TLearner.Create('A', 1);
  WriteLn(objL.fName);
end.`);
    expect(e.message).toContain("fName is private. Use a method to reach it.");
  });

  test("properties and single inheritance with inherited Create and override", () => {
    const src = `type
  TAnimal = class
  protected
    fName: String;
  public
    constructor Create(sName: String);
    function Speak: String; virtual;
    property Name: String read fName write fName;
  end;
  TDog = class(TAnimal)
  public
    constructor Create(sName: String);
    function Speak: String; override;
  end;
constructor TAnimal.Create(sName: String);
begin
  fName := sName;
end;
function TAnimal.Speak: String;
begin
  Result := '...';
end;
constructor TDog.Create(sName: String);
begin
  inherited Create(sName + ' the dog');
end;
function TDog.Speak: String;
begin
  Result := inherited Speak + 'Woof';
end;
var a: TAnimal; d: TDog;
begin
  a := TAnimal.Create('Cat');
  d := TDog.Create('Rex');
  WriteLn(a.Name, ': ', a.Speak);
  WriteLn(d.Name, ': ', d.Speak);
  d.Name := 'Max';
  WriteLn(d.Name);
  a := d;
  WriteLn(a.Speak);
end.`;
    expect(out(src)).toBe("Cat: ...\nRex the dog: ...Woof\nMax\n...Woof\n");
  });
});

describe("formatting", () => {
  test("width and decimals in Write", () => {
    expect(out(main("r := 3.14159; WriteLn(r:8:2); WriteLn(r:0:3); WriteLn(42:5, '|'); WriteLn('ab':4, '|'); WriteLn(-2.5:6:1);", "var r: Real;"))).toBe("    3.14\n3.142\n   42|\n  ab|\n  -2.5\n");
  });

  test("FloatToStrF, FormatFloat and Format", () => {
    const body = [
      "WriteLn(FloatToStrF(1234.567, ffFixed, 8, 2));",
      "WriteLn(FloatToStrF(1234.5, ffCurrency, 8, 2));",
      "WriteLn(FloatToStrF(1234.5, ffNumber, 8, 1));",
      "WriteLn(FormatFloat('0.00', 2.5), ' ', FormatFloat('#,##0.00', 1234567.891), ' ', FormatFloat('R 0.00', 7));",
      "WriteLn(Format('%d apples cost %.2f, %s!', [3, 4.5, 'yes']));",
      "WriteLn(Format('[%5d][%-5s][%f]', [42, 'ab', 1.0]));",
    ].join("\n");
    expect(out(main(body))).toBe("1234.57\nR1,234.50\n1,234.5\n2.50 1,234,567.89 R 7.00\n3 apples cost 4.50, yes!\n[   42][ab   ][1.00]\n");
  });
});

describe("exceptions", () => {
  test("try..except catches a bad conversion; the Delphi console template works", () => {
    const src = `var x: Integer;
begin
  try
    x := StrToInt('abc');
  except
    WriteLn('Not a number');
  end;
  try
    x := 10 div x;
  except
    on E: Exception do
      Writeln(E.ClassName, ': ', E.Message);
  end;
end.`;
    expect(out(src)).toBe("Not a number\nEDivByZero: You used div with zero, which means dividing by zero. Check the number after \"div\".\n");
  });

  test("raise, try..finally", () => {
    const src = `begin
  try
    try
      raise Exception.Create('Too big');
    finally
      WriteLn('cleanup');
    end;
  except
    on E: Exception do WriteLn(E.Message);
  end;
end.`;
    expect(out(src)).toBe("cleanup\nToo big\n");
  });
});

describe("syntax errors", () => {
  test("missing semicolon points at the next line", () => {
    const e = err("program P;\nvar x: Integer;\nbegin\n  x := 5;\n  x := x + 1\n  WriteLn(x);\nend.");
    expect(e).toEqual({ message: 'Line 6: I expected ";" before "WriteLn". Is the line above missing a semicolon?', line: 6 });
  });

  test("undeclared identifier, caught before anything runs", () => {
    const r = runPascal("program P;\nvar iTotal: Integer;\nbegin\n  WriteLn('start');\n  iTotaal := 5;\nend.");
    expect(r.stdout).toBe("");
    expect(r.error).toEqual({ message: 'Line 5: "iTotaal" has not been declared. Check the spelling.', line: 5 });
  });

  test("undeclared name inside a branch that never runs", () => {
    expect(err(main("if False then\n  WriteLn(sNmae);", "var sName: String;")).line).toBe(5);
  });

  test("other common mistakes get specific hints", () => {
    expect(err("begin\n  if True then WriteLn('a');\n  else WriteLn('b');\nend.").message).toBe('Line 3: Remove the ";" just before "else". In Pascal there is never a semicolon directly before else.');
    expect(err("var x: Integer;\nbegin\n  x = 5;\nend.").message).toContain("Use := to give a variable a value");
    expect(err("var x: Integer;\nbegin\n  if x > 1 and x < 5 then x := 1;\nend.").message).toContain("Put brackets around each comparison");
    expect(err('begin\n  WriteLn("hi");\nend.').message).toContain("single quotes");
    expect(err("begin\n  WriteLn('hi);\nend.").message).toContain("never closed");
    expect(err("begin\n  WriteLn('a');\n").message).toContain('reached the end of the program. Every "begin" needs a matching "end".');
    expect(err("begin\n  Break;\nend.").message).toContain("only be used inside a loop");
    expect(err("var x: Intger;\nbegin end.").message).toContain('"Intger" is not a type I know');
  });
});

describe("runtime errors", () => {
  test("division by zero", () => {
    const r = runPascal(main("x := 0;\nWriteLn('before');\nWriteLn(10 div x);", "var x: Integer;"));
    expect(r.stdout).toBe("before\n");
    expect(r.error.line).toBe(6);
    expect(r.error.message).toContain("dividing by zero");
    expect(err(main("WriteLn(1 / 0);")).message).toContain("You divided by zero");
  });

  test("array index out of range gives the index and the bounds", () => {
    const e = err(main("for i := 1 to 6 do\n  arrMarks[i] := i;", "var arrMarks: array[1..5] of Integer; i: Integer;"));
    expect(e).toEqual({ message: "Line 5: Index 6 is out of range. arrMarks goes from 1 to 5.", line: 5 });
    expect(err(main("WriteLn(a[0]);", "var a: array of Integer;")).message).toContain("Use SetLength");
  });

  test("string index out of range", () => {
    expect(err(main("s := 'Hi';\nWriteLn(s[3]);", "var s: String;")).message).toBe("Line 5: Position 3 is outside the text 'Hi'. It has 2 characters, so use positions 1 to 2.");
  });

  test("wrong number of arguments", () => {
    const src = "procedure Greet(sName: String);\nbegin\n  WriteLn(sName);\nend;\nbegin\n  Greet('a', 'b');\nend.";
    expect(err(src)).toEqual({ message: "Line 6: Greet needs 1 value in brackets, but 2 were given.", line: 6 });
    expect(err(main("WriteLn(Copy('abc'));")).message).toContain("Copy needs 2 to 3 values");
  });

  test("type mistakes in assignments and calls", () => {
    expect(err(main("iTotal := 'ten';", "var iTotal: Integer;")).message).toBe("Line 4: iTotal is an Integer, so it cannot hold text. Use StrToInt to turn text into a number.");
    expect(err(main("iTotal := 7 / 2;", "var iTotal: Integer;")).message).toContain("Use Round or Trunc");
    expect(err(main("s := 5;", "var s: String;")).message).toContain("Use IntToStr");
    expect(err(main("s := 'Total: ' + 5;", "var s: String;")).message).toContain("cannot add a number and text");
    expect(err(main("WriteLn(IntToStr(2.5));")).message).toContain("Use FloatToStr");
    expect(err(main("x := 7.5 div 2;", "var x: Integer;")).message).toContain("only works with whole numbers");
    expect(err(main("if x then WriteLn(1);", "var x: Integer;")).message).toContain("must be True or False");
    expect(err("const MAX = 5;\nbegin\n  MAX := 6;\nend.").message).toContain("constant");
  });

  test("the step limit stops an infinite loop", () => {
    const r = runPascal(main("i := 0;\nwhile i < 10 do\n  WriteLn('stuck');", "var i: Integer;"), { maxOutput: 10000000 });
    expect(r.error.message).toBe("Your program ran for too long and was stopped. Check your loops: one of them may never end.");
    expect(r.error.line).not.toBeNull();
    expect(r.stdout.startsWith("stuck\n")).toBe(true);
    expect(runPascal("begin repeat until False; end.").error.message).toContain("ran for too long");
    expect(runPascal("begin while True do ; end.", { maxSteps: 1000 }).error.message).toContain("ran for too long");
  });

  test("the output limit stops a flood of output", () => {
    const r = runPascal("begin while True do Write('xxxxxxxxxx'); end.", { maxOutput: 100 });
    expect(r.error.message).toBe("Your program printed too much. Is a loop running forever?");
    expect(r.stdout.length).toBe(100);
  });

  test("runaway recursion stops with a friendly message", () => {
    const src = "function Count(n: Integer): Integer;\nbegin\n  Result := Count(n + 1);\nend;\nbegin\n  WriteLn(Count(1));\nend.";
    expect(err(src).message).toBe("The program called itself too many times. Check that your recursion has a stopping condition.");
  });

  test("moderately deep recursion still works", () => {
    const src = "function Sum(n: Integer): Integer;\nbegin\n  if n = 0 then Result := 0 else Result := n + Sum(n - 1);\nend;\nbegin\n  WriteLn(Sum(500));\nend.";
    expect(out(src)).toBe("125250\n");
  });

  test("huge allocations and text growth cannot hang the runner", () => {
    expect(runPascal("var a: array of Integer; i: Integer;\nbegin for i := 1 to 100000 do SetLength(a, 1000000); end.").error.message).toContain("ran for too long");
    expect(runPascal("var s: String; i: Integer;\nbegin s := 'x'; for i := 1 to 40 do s := s + s; end.").error.message).toContain("too long");
  });
});
