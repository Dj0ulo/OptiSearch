function isMathExpr(expr) {
  const test = (expr, variables) => {
    if (!variables)
      variables = [];
    try {
      let scope = {};
      if (variables[0]) scope[variables[0]] = 1;
      if (variables[1]) scope[variables[1]] = 1;
      let answer = math.evaluate(expr, scope);
      return {
        answer: answer,
        vars: variables,
        expr: expr
      };
    } catch (error) {
      if (error.message.startsWith("Undefined symbol ")) {
        let symbol = error.message.slice("Undefined symbol ".length);
        if ((symbol != 'x' && symbol != 'y' && symbol != 'z') || variables.length >= 2)
          return null;
        variables.push(symbol);
        return test(expr, variables);
      }
      else if (error.message.startsWith("Unexpected operator , ")) {
        return test(expr.replace(/,/g, ";"), variables);
      }
    }
    return null;
  }
  return test(expr);
}

function linspace(l, h, n) {
  if (!n)
    n = 100;
  let x = new Array(n);
  for (let i = 0; i < x.length; i++) {
    x[i] = (h - l) / (n - 1) * i + l;
  }
  return x;
}

function calcFun(expr, nameVar, space) {
  if (Array.isArray(space)) {
    let y = new Array(space.length);
    let scopes = new Array(space.length);
    for (let i = 0; i < y.length; i++) {
      let scope = {};
      scope[nameVar] = space[i];
      y[i] = math.evaluate(expr, scope);
      scopes[i] = scope;
    }
    return y;
  } else if (typeof space == 'number') {
    let scope = {};
    scope[nameVar] = space;
    return math.evaluate(expr, scope);
  }
  return null;
}
function abs(x) {
  return Math.abs(x);
}
function plotFun(fun, idDiv, range) {
  if (fun.vars.length > 1)
    return;

  if (!range) {
    range = {
      left: -5,
      right: 5,
      // bottom : -5,
      // top : 5,
    };
  }

  let data = [];

  let exprs = fun.expr.split(";");
  let yMin = null;
  exprs.forEach(e => {
    let space = linspace(range.left, range.right, 1000);

    let f = e;
    let equals = e.search("=");
    if (equals != -1)
      f = e.slice(equals + 1);
    f = f.trim();
    let nameVar = fun.vars[0];
    let fy = calcFun(e, nameVar, space);

    let indexMin = 0;
    for (let i = 1; i < fy.length; i++) {
      const y = abs(fy[i]);
      if (y < abs(fy[indexMin]))
        indexMin = i;
    }
    if (!yMin || abs(fy[indexMin]) < abs(yMin))
      yMin = fy[indexMin];

    try {
      let df = math.derivative(f, nameVar).toString();
      let dfy = calcFun(df, nameVar, space);
      const maxAsym = 10;
      let asympIndex = [];
      for (let i = 1; i < dfy.length - 1; i++) {
        if (Math.abs(dfy[i]) > Math.abs(dfy[i + 1]) && Math.abs(dfy[i]) >= Math.abs(dfy[i - 1])) {
          asympIndex.push(i);
          if (asympIndex.length > maxAsym)
            break;
        }
      }
      if (asympIndex.length <= maxAsym) {
        asympIndex.forEach(i => {
          fy[i - 1] = -Infinity;
          fy[i] = Infinity;
        });
      }

    } catch (error) {

    }

    data.push({
      x: space,
      y: fy,
      mode: 'lines',
      name: e.trim()
    });


  });

  var autorange = false;
  if (!range.bottom || !range.top) {
    range.bottom = yMin - 5;
    range.top = yMin + 5;
  }
  //     autorange = false;

  const layout = {
    margin: {
      l: 20,
      r: 20,
      b: 20,
      t: 20,
      pad: 5,
      // autoexpand: false,
    },
    legend: {
      orientation: 'h'
    },
    width: 590,
    title: false,
    dragmode: 'pan',
    xaxis: { range: [range.left, range.right] },
    yaxis: { range: [range.bottom, range.top], autorange: autorange },
    // plot_bgcolor:"black",
    // paper_bgcolor:"#FFF3",
  };

  Plotly.newPlot(idDiv, data, layout);

  const plot = document.getElementById(idDiv);
  plot.on('plotly_relayout', (eventData) => {
    if (eventData['xaxis.autorange'] == true)
      plotFun(fun, idDiv);
    if (eventData['xaxis.range[0]']) {
      const range = {
        left: eventData['xaxis.range[0]'],
        right: eventData['xaxis.range[1]'],
        bottom: eventData['yaxis.range[0]'],
        top: eventData['yaxis.range[1]']
      };
      plotFun(fun, idDiv, range);
    }
  });
}