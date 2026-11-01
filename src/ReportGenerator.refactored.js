const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  USER: 'USER',
});

const REPORT_TYPES = Object.freeze({
  CSV: 'CSV',
  HTML: 'HTML',
});

const THRESHOLDS = Object.freeze({
  ADMIN_PRIORITY: 1000,
  USER_MAX_VALUE: 500,
});

class CsvReportFormatter {
  getHeader() {
    return 'ID,NOME,VALOR,USUARIO\n';
  }

  formatRow(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  }

  getFooter(total) {
    return `\nTotal,,\n${total},,\n`;
  }
}

class HtmlReportFormatter {
  getHeader(user) {
    return (
      '<html><body>\n' +
      '<h1>Relatório</h1>\n' +
      `<h2>Usuário: ${user.name}</h2>\n` +
      '<table>\n' +
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n'
    );
  }

  formatRow(item) {
    const styleAttr = item.priority ? ' style="font-weight:bold;"' : '';
    return `<tr${styleAttr}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }

  getFooter(total) {
    return `</table>\n<h3>Total: ${total}</h3>\n</body></html>\n`;
  }
}

const FORMATTERS = Object.freeze({
  [REPORT_TYPES.CSV]: new CsvReportFormatter(),
  [REPORT_TYPES.HTML]: new HtmlReportFormatter(),
});

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  generateReport(reportType, user, items) {
    const formatter = this._resolveFormatter(reportType);
    const visibleItems = this._filterAndProcessItems(user, items);
    const total = this._calculateTotal(visibleItems);

    return this._renderReport(formatter, user, visibleItems, total);
  }

  _resolveFormatter(reportType) {
    const formatter = FORMATTERS[reportType];
    if (!formatter) {
      throw new Error(`Tipo de relatório não suportado: ${reportType}`);
    }
    return formatter;
  }

  _filterAndProcessItems(user, items) {
    if (user.role === ROLES.ADMIN) {
      return items.map((item) => ({
        ...item,
        priority: item.value > THRESHOLDS.ADMIN_PRIORITY,
      }));
    }

    if (user.role === ROLES.USER) {
      return items.filter((item) => item.value <= THRESHOLDS.USER_MAX_VALUE);
    }

    return [];
  }

  _calculateTotal(items) {
    return items.reduce((acc, item) => acc + item.value, 0);
  }

  _renderReport(formatter, user, items, total) {
    let report = formatter.getHeader(user);

    for (const item of items) {
      report += formatter.formatRow(item, user);
    }

    report += formatter.getFooter(total);
    return report.trim();
  }
}
