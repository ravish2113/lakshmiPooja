package com.lakshmipooja.ledger.controller;

import com.lakshmipooja.ledger.dto.DonationResponse;
import com.lakshmipooja.ledger.dto.ExpenditureResponse;
import com.lakshmipooja.ledger.service.DonationService;
import com.lakshmipooja.ledger.service.ExpenditureService;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {
    private final DonationService donations;
    private final ExpenditureService expenditures;

    public ReportController(DonationService donations, ExpenditureService expenditures) {
        this.donations = donations;
        this.expenditures = expenditures;
    }

    @GetMapping(value = "/{year}/donations.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> donationReport(@PathVariable Integer year) {
        List<DonationResponse> rows = donations.findByYear(year);
        byte[] pdf = createDonationPdf(year, rows);
        return pdfResponse(pdf, "donations-" + year + ".pdf");
    }

    @GetMapping(value = "/{year}/expenditures.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> expenditureReport(@PathVariable Integer year) {
        List<ExpenditureResponse> rows = expenditures.findByYear(year);
        byte[] pdf = createExpenditurePdf(year, rows);
        return pdfResponse(pdf, "expenditures-" + year + ".pdf");
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] pdf, String fileName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename(fileName).build());
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    private byte[] createDonationPdf(Integer year, List<DonationResponse> rows) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 28, 28, 30, 30);
        PdfWriter.getInstance(document, out);
        document.open();
        addTitle(document, "Shri Shri Lakshmi Pooja Samiti Mustafapur", "Donation Report - " + year);

        PdfPTable table = new PdfPTable(new float[]{1.2f, 2.2f, 1.5f, 1.1f, 1.1f, 1.2f, 2.5f});
        table.setWidthPercentage(100);
        addHeaders(table, "Date", "Donor Name", "Father / Mother Name", "Mode", "Status", "Amount", "Notes");
        for (DonationResponse r : rows) {
            addCell(table, value(r.donationDate()));
            addCell(table, r.donorName());
            addCell(table, value(r.fatherMotherName()));
            addCell(table, r.paymentMode());
            addCell(table, r.paymentStatus());
            addCell(table, amount(r.amount()));
            addCell(table, value(r.notes()));
        }
        document.add(table);
        addDonationSummary(document, rows);
        document.close();
        return out.toByteArray();
    }

    private byte[] createExpenditurePdf(Integer year, List<ExpenditureResponse> rows) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 26, 26);
        PdfWriter.getInstance(document, out);
        document.open();
        addTitle(document, "Shri Shri Lakshmi Pooja Samiti Mustafapur", "Expenditure Report - " + year);

        PdfPTable table = new PdfPTable(new float[]{1.0f, 1.8f, 1.2f, 1.5f, 1.15f, 1.15f, 1.15f, 1.5f, 1.8f});
        table.setWidthPercentage(100);
        addHeaders(table, "Date", "Item / Service", "Category", "Vendor", "Total Cost", "Paid", "Left", "Receipt", "Notes");
        for (ExpenditureResponse r : rows) {
            addCell(table, value(r.expenseDate()));
            addCell(table, r.title());
            addCell(table, r.category());
            addCell(table, value(r.vendor()));
            addCell(table, amount(r.totalCost()));
            addCell(table, amount(r.paidAmount()));
            addCell(table, amount(r.leftAmount()));
            addCell(table, value(r.receiptReference()));
            addCell(table, value(r.notes()));
        }
        document.add(table);
        addExpenditureSummary(document, rows);
        document.close();
        return out.toByteArray();
    }

    private void addTitle(Document document, String heading, String subheading) {
        Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Font sub = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        Paragraph p1 = new Paragraph(heading, title);
        p1.setAlignment(Element.ALIGN_CENTER);
        document.add(p1);
        Paragraph p2 = new Paragraph(subheading, sub);
        p2.setAlignment(Element.ALIGN_CENTER);
        p2.setSpacingAfter(14);
        document.add(p2);
    }

    private void addHeaders(PdfPTable table, String... headers) {
        Font font = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, font));
            cell.setPadding(6);
            cell.setBackgroundColor(new java.awt.Color(238, 238, 238));
            table.addCell(cell);
        }
    }

    private void addCell(PdfPTable table, String value) {
        PdfPCell cell = new PdfPCell(new Phrase(value == null ? "" : value, FontFactory.getFont(FontFactory.HELVETICA, 8)));
        cell.setPadding(5);
        table.addCell(cell);
    }

    private void addDonationSummary(Document document, List<DonationResponse> rows) {
        BigDecimal total = rows.stream().map(DonationResponse::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paid = rows.stream().filter(r -> "PAID".equals(r.paymentStatus())).map(DonationResponse::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal unpaid = total.subtract(paid);
        Paragraph p = new Paragraph("Total: " + amount(total) + "    Paid: " + amount(paid) + "    Unpaid: " + amount(unpaid), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10));
        p.setSpacingBefore(12);
        document.add(p);
    }

    private void addExpenditureSummary(Document document, List<ExpenditureResponse> rows) {
        BigDecimal total = rows.stream().map(ExpenditureResponse::totalCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paid = rows.stream().map(ExpenditureResponse::paidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal left = total.subtract(paid);
        Paragraph p = new Paragraph("Total Cost: " + amount(total) + "    Paid: " + amount(paid) + "    Left to Pay: " + amount(left), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10));
        p.setSpacingBefore(12);
        document.add(p);
    }

    private String amount(BigDecimal value) {
        return "Rs. " + (value == null ? BigDecimal.ZERO : value).setScale(2).toPlainString();
    }

    private String value(Object value) {
        return value == null ? "" : value.toString();
    }
}
