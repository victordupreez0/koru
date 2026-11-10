// Python that runs inside Pyodide. Kept as strings so the worker can install it once at start-up.

/**
 * A stand-in for Python's turtle module. Real turtle needs a desktop window, so this one only
 * records what was drawn; the page then replays those commands on a canvas.
 * Coordinates match the real module: (0, 0) is the centre, x goes right, y goes up, 0 degrees faces right.
 */
export const TURTLE_MODULE = String.raw`
import math as _math

_commands = []
_turtles = []
_MAX = 20000


def _emit(*command):
    if len(_commands) < _MAX:
        _commands.append(list(command))


def _reset_all():
    _commands.clear()
    _turtles.clear()


def _css(*args):
    """Turns turtle colours ('red', '#ff0000', (255, 0, 0), (1.0, 0, 0)) into a CSS colour."""
    if len(args) == 1:
        args = args[0]
    if isinstance(args, str):
        return args
    r, g, b = args
    if max(r, g, b) <= 1:
        r, g, b = r * 255, g * 255, b * 255
    return "rgb(%d, %d, %d)" % (round(r), round(g), round(b))


class Turtle:
    def __init__(self, shape="classic", visible=True):
        self._id = len(_turtles)
        _turtles.append(self)
        self._x = 0.0
        self._y = 0.0
        self._heading = 0.0
        self._down = True
        self._pen = "black"
        self._fill = "black"
        self._width = 1
        self._path = None
        _emit("new", self._id)

    # --- moving ---
    def _go(self, x, y):
        if self._down:
            _emit("line", self._id, self._x, self._y, x, y, self._pen, self._width)
        else:
            _emit("move", self._id, x, y)
        self._x, self._y = x, y
        if self._path is not None:
            self._path.append([x, y])

    def forward(self, distance):
        angle = _math.radians(self._heading)
        self._go(self._x + distance * _math.cos(angle), self._y + distance * _math.sin(angle))

    def backward(self, distance):
        self.forward(-distance)

    def right(self, angle):
        self.setheading(self._heading - angle)

    def left(self, angle):
        self.setheading(self._heading + angle)

    def setheading(self, angle):
        self._heading = angle % 360
        _emit("turn", self._id, self._heading)

    def goto(self, x, y=None):
        if y is None:
            x, y = x
        self._go(float(x), float(y))

    def setx(self, x):
        self._go(float(x), self._y)

    def sety(self, y):
        self._go(self._x, float(y))

    def home(self):
        self._go(0.0, 0.0)
        self.setheading(0)

    def circle(self, radius, extent=360, steps=None):
        if steps is None:
            steps = max(12, int(abs(radius) / 3) + 12)
        steps = max(1, int(steps * abs(extent) / 360))
        turn = extent / steps
        side = 2 * abs(radius) * _math.sin(_math.radians(abs(turn)) / 2)
        direction = 1 if radius >= 0 else -1
        self.left(direction * turn / 2)
        for _ in range(steps):
            self.forward(side)
            self.left(direction * turn)
        self.right(direction * turn / 2)

    def dot(self, size=None, *color):
        _emit("dot", self._id, self._x, self._y, size or max(self._width + 4, self._width * 2), _css(*color) if color else self._pen)

    def write(self, text, move=False, align="left", font=("Arial", 12, "normal")):
        _emit("text", self._id, self._x, self._y, str(text), self._pen, int(font[1]) if len(font) > 1 else 12, align)

    def stamp(self):
        _emit("dot", self._id, self._x, self._y, 10, self._pen)

    # --- pen ---
    def penup(self):
        self._down = False

    def pendown(self):
        self._down = True

    def isdown(self):
        return self._down

    def pensize(self, width=None):
        if width is None:
            return self._width
        self._width = width

    def pencolor(self, *args):
        if not args:
            return self._pen
        self._pen = _css(*args)

    def fillcolor(self, *args):
        if not args:
            return self._fill
        self._fill = _css(*args)

    def color(self, *args):
        if not args:
            return self._pen, self._fill
        if len(args) == 2:
            self._pen, self._fill = _css(args[0]), _css(args[1])
        else:
            self._pen = self._fill = _css(*args)

    def begin_fill(self):
        self._path = [[self._x, self._y]]

    def end_fill(self):
        if self._path and len(self._path) > 2:
            _emit("fill", self._id, self._fill, self._path)
        self._path = None

    def clear(self):
        _emit("clear")

    def reset(self):
        self.clear()
        self.penup()
        self.home()
        self.pendown()

    # --- looking ---
    def position(self):
        return (self._x, self._y)

    def xcor(self):
        return self._x

    def ycor(self):
        return self._y

    def heading(self):
        return self._heading

    def distance(self, x, y=None):
        if y is None:
            x, y = x
        return _math.hypot(x - self._x, y - self._y)

    def towards(self, x, y=None):
        if y is None:
            x, y = x
        return _math.degrees(_math.atan2(y - self._y, x - self._x)) % 360

    def hideturtle(self):
        _emit("show", self._id, False)

    def showturtle(self):
        _emit("show", self._id, True)

    def speed(self, speed=None):
        if speed is not None:
            _emit("speed", speed)

    # Accepted so real turtle programs run unchanged; they change nothing here.
    def shape(self, *args): pass
    def shapesize(self, *args, **kwargs): pass
    def turtlesize(self, *args, **kwargs): pass

    fd = forward
    bk = back = backward
    rt = right
    lt = left
    seth = setheading
    setpos = setposition = goto
    pu = up = penup
    pd = down = pendown
    width = pensize
    ht = hideturtle
    st = showturtle
    pos = position


Pen = RawTurtle = Turtle


class _Screen:
    def bgcolor(self, *args):
        if args:
            _emit("bg", _css(*args))

    def __getattr__(self, name):
        # setup, title, tracer, update, exitonclick, mainloop... nothing to do in a browser.
        return lambda *args, **kwargs: None


_screen = _Screen()


def Screen():
    return _screen


def _default():
    return _turtles[0] if _turtles else Turtle()


def _module_function(name):
    def call(*args, **kwargs):
        return getattr(_default(), name)(*args, **kwargs)
    call.__name__ = name
    return call


for _name in [n for n in dir(Turtle) if not n.startswith("_")]:
    globals()[_name] = _module_function(_name)


def bgcolor(*args):
    _screen.bgcolor(*args)


def done(): pass
def mainloop(): pass
def exitonclick(): pass
def tracer(*args, **kwargs): pass
def update(): pass
def colormode(*args): pass
def setup(*args, **kwargs): pass
def title(*args): pass
`;

/** Runs one program and reports what it printed, what it drew and what went wrong. */
export const RUNNER = String.raw`
import json as _json
import sys as _sys
import traceback as _traceback

_FILE = "<your code>"
_MAX_OUTPUT = 20000


class _Output:
    def __init__(self):
        self.parts = []
        self.size = 0

    def write(self, text):
        text = str(text)
        self.size += len(text)
        if self.size > _MAX_OUTPUT:
            raise RuntimeError("Your program printed too much. Is a loop running forever?")
        self.parts.append(text)
        return len(text)

    def flush(self):
        pass

    def getvalue(self):
        return "".join(self.parts)


def _explain(error):
    line = None
    if isinstance(error, SyntaxError) and error.filename == _FILE:
        return {"message": "SyntaxError: " + str(error.msg), "line": error.lineno}
    for frame in reversed(_traceback.extract_tb(error.__traceback__)):
        if frame.filename == _FILE:
            line = frame.lineno
            break
    name = type(error).__name__
    text = str(error)
    if name in ("EOFError", "RuntimeError", "RecursionError") and text:
        return {"message": text if name != "RecursionError" else "RecursionError: the function called itself too many times. Check its stopping condition.", "line": line}
    return {"message": name + (": " + text if text else ""), "line": line}


def _koru_run(code, stdin_text):
    import turtle
    turtle._reset_all()
    out = _Output()
    lines = iter(stdin_text.split("\n")) if stdin_text else iter(())

    def _input(prompt=""):
        out.write(prompt)
        try:
            line = next(lines)
        except StopIteration:
            raise EOFError("The program asked for input, but there was nothing left to read. Add another line to the Input box.")
        out.write(line + "\n")
        return line

    scope = {"__name__": "__main__", "input": _input}
    error = None
    previous = _sys.stdout
    _sys.stdout = out
    try:
        exec(compile(code, _FILE, "exec"), scope)
    except SystemExit:
        pass
    except BaseException as problem:
        error = _explain(problem)
    finally:
        _sys.stdout = previous
    return _json.dumps({"stdout": out.getvalue(), "error": error, "turtle": turtle._commands})
`;
