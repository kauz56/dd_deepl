/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */
import DocumentService from "@typo3/core/document-service.js";
import $ from "jquery";
import {
    SeverityEnum
} from "@typo3/backend/enum/severity.js";
import AjaxRequest from "@typo3/core/ajax/ajax-request.js";
import Icons from "@typo3/backend/icons.js";
import Wizard from "@typo3/backend/wizard.js";
import "@typo3/backend/element/icon-element.js";
let deeplLocalizationMode = 'localize'; // forkchange
if (TYPO3?.settings?.tx_dddeepl?.settings?.useFreeMode == 1) { // forkchange
    deeplLocalizationMode = 'copyFromLanguage'; // forkchange
} // forkchange
class LocalizationDeepl {
    constructor() {
        this.triggerButton = ".t3js-localize", this.localizationMode = null, this.sourceLanguage = null, this.records = [], DocumentService.ready().then((() => {
            this.initialize()
        }))
    }
    initialize() {
        $(document).off("click", this.triggerButton), Icons.getIcon("actions-localize", Icons.sizes.large).then((e => {
            Icons.getIcon("actions-edit-copy", Icons.sizes.large).then((a => {
                $(this.triggerButton).removeClass("disabled"), $(document).on("click", this.triggerButton, (t => {
                    t.preventDefault();
                    const l = $(t.currentTarget),
                        o = [],
                        i = [];
                    let s = "";
                    l.data("allowTranslate") && (o.push('<div class="row"><div class="col-sm-3"><label class="btn btn-default d-block t3js-localization-option" data-helptext=".t3js-helptext-translate">' + e + '<input type="radio" name="mode" id="mode_translate" value="localize" style="display: none"><br>' + TYPO3.lang["localize.wizard.button.translate"] + '</label></div><div class="col-sm-9"><p class="t3js-helptext t3js-helptext-translate text-body-secondary">' + TYPO3.lang["localize.educate.translate"] + "</p></div></div>"), i.push("localize"), o.push('<div class="row mb-4"><div class="col-sm-3"><label class="btn btn-default d-block t3js-localization-option" data-helptext=".t3js-helptext-translate">' + e + '<input type="radio" name="mode" id="mode_translate" value="deepl" style="display: none"><br>' + TYPO3.lang["localize.wizard.button.deepl"] + '</label></div><div class="col-sm-9"><p class="t3js-helptext t3js-helptext-translate text-body-secondary">' + TYPO3.lang["localize.educate.deepl"] + "</p></div></div>"), i.push("deepl")), l.data("allowCopy") && (o.push('<div class="row"><div class="col-sm-3"><label class="btn btn-default d-block t3js-localization-option" data-helptext=".t3js-helptext-copy">' + a + '<input type="radio" name="mode" id="mode_copy" value="copyFromLanguage" style="display: none"><br>' + TYPO3.lang["localize.wizard.button.copy"] + '</label></div><div class="col-sm-9"><p class="t3js-helptext t3js-helptext-copy text-body-secondary">' + TYPO3.lang["localize.educate.copy"] + "</p></div></div>"), i.push("copyFromLanguage")), 0 === l.data("allowTranslate") && 0 === l.data("allowCopy") && o.push('<div class="row"><div class="col-sm-12"><div class="alert alert-warning"><div class="media"><div class="media-left"><span class="icon-emphasized"><typo3-backend-icon identifier="actions-exclamation" size="small"></typo3-backend-icon></span></div><div class="media-body"><p class="alert-message">' + TYPO3.lang["localize.educate.noTranslate"] + "</p></div></div></div></div></div>"), s += '<div data-bs-toggle="buttons">' + o.join("") + "</div>", Wizard.addSlide("localize-choose-action", TYPO3.lang["localize.wizard.header_page"].replace("{0}", l.data("page")).replace("{1}", l.data("languageName")), s, SeverityEnum.info, (() => {
                        1 === i.length && (this.localizationMode = i[0], Wizard.unlockNextStep().trigger("click"))
                    })), Wizard.addSlide("localize-choose-language", TYPO3.lang["localize.view.chooseLanguage"], "", SeverityEnum.info, (e => {
                        Icons.getIcon("spinner-circle", Icons.sizes.large).then((a => {
                            e.html('<div class="text-center">' + a + "</div>"), this.loadAvailableLanguages(parseInt(l.data("pageId"), 10), parseInt(l.data("languageId"), 10)).then((async a => {
                                const t = await a.resolve();
                                if (1 === t.length) return this.sourceLanguage = t[0].uid, void Wizard.unlockNextStep().trigger("click");
                                Wizard.getComponent().on("click", ".t3js-language-option", (e => {
                                    const a = $(e.currentTarget).prev();
                                    this.sourceLanguage = a.val(), Wizard.unlockNextStep()
                                }));
                                const l = $("<div />", {
                                    class: "row"
                                });
                                for (const e of t) {
                                    const a = "language" + e.uid,
                                        t = $("<input />", {
                                            type: "radio",
                                            name: "language",
                                            id: a,
                                            value: e.uid,
                                            style: "display: none;",
                                            class: "btn-check"
                                        }),
                                        o = $("<label />", {
                                            class: "btn btn-default d-block t3js-language-option option",
                                            for: a
                                        }).text(" " + e.title).prepend(e.flagIcon);
                                    l.append($("<div />", {
                                        class: "col-sm-4"
                                    }).append(t).append(o))
                                }
                                e.empty().append(l)
                            }))
                        }))
                    })), Wizard.addSlide("localize-summary", TYPO3.lang["localize.view.summary"], "", SeverityEnum.info, (e => {
                        Icons.getIcon("spinner-circle", Icons.sizes.large).then((a => {
                            e.html('<div class="text-center">' + a + "</div>")
                        })), this.getSummary(parseInt(l.data("pageId"), 10), parseInt(l.data("languageId"), 10)).then((async a => {
                            const t = await a.resolve();
                            e.empty(), this.records = [];
                            const l = t.columns.columns;
                            t.columns.columnList.forEach((a => {
                                if (void 0 === t.records[a]) return;
                                const o = l[a],
                                    i = $("<div />", {
                                        class: "row"
                                    });
                                t.records[a].forEach((e => {
                                    const a = " (" + e.uid + ") " + e.title;
                                    this.records.push(e.uid), i.append($("<div />", {
                                        class: "col-sm-6"
                                    }).append($("<div />", {
                                        class: "input-group"
                                    }).append($("<span />", {
                                        class: "input-group-addon"
                                    }).append($("<input />", {
                                        type: "checkbox",
                                        class: "t3js-localization-toggle-record",
                                        id: "record-uid-" + e.uid,
                                        checked: "checked",
                                        "data-uid": e.uid,
                                        "aria-label": a
                                    })), $("<label />", {
                                        class: "form-control",
                                        for: "record-uid-" + e.uid
                                    }).text(a).prepend(e.icon))))
                                })), e.append($("<fieldset />", {
                                    class: "localization-fieldset"
                                }).append($("<label />").text(o).prepend($("<input />", {
                                    class: "t3js-localization-toggle-column",
                                    type: "checkbox",
                                    checked: "checked"
                                })), i))
                            })), Wizard.unlockNextStep(), Wizard.getComponent().on("change", ".t3js-localization-toggle-record", (e => {
                                const a = $(e.currentTarget),
                                    t = a.data("uid"),
                                    l = a.closest("fieldset"),
                                    o = l.find(".t3js-localization-toggle-column");
                                if (a.is(":checked")) this.records.push(t);
                                else {
                                    const e = this.records.indexOf(t);
                                    e > -1 && this.records.splice(e, 1)
                                }
                                const i = l.find(".t3js-localization-toggle-record"),
                                    s = l.find(".t3js-localization-toggle-record:checked");
                                o.prop("checked", s.length > 0), o.prop("indeterminate", s.length > 0 && s.length < i.length), this.records.length > 0 ? Wizard.unlockNextStep() : Wizard.lockNextStep()
                            })).on("change", ".t3js-localization-toggle-column", (e => {
                                const a = $(e.currentTarget),
                                    t = a.closest("fieldset").find(".t3js-localization-toggle-record");
                                t.prop("checked", a.is(":checked")), t.trigger("change")
                            }))
                        }))
                    })), Wizard.addFinalProcessingSlide((() => {
                        this.localizeRecords(parseInt(l.data("pageId"), 10), parseInt(l.data("languageId"), 10), this.records).then((() => {
                            Wizard.dismiss(), document.location.reload()
                        }))
                    })).then((() => {
                        Wizard.show(), Wizard.getComponent().on("click", ".t3js-localization-option", (e => {
                            const a = $(e.currentTarget),
                                t = a.find('input[type="radio"]');
                            if (a.data("helptext")) {
                                const t = $(e.delegateTarget);
                                t.find(".t3js-localization-option").removeClass("active"), t.find(".t3js-helptext").addClass("text-body-secondary"), a.addClass("active"), t.find(a.data("helptext")).removeClass("text-body-secondary")
                            }
                            this.localizationMode = t.val(), Wizard.unlockNextStep()
                        }))
                    }))
                }))
            }))
        }))
    }
    loadAvailableLanguages(e, a) {
        return new AjaxRequest(TYPO3.settings.ajaxUrls.page_languages).withQueryArguments({
            pageId: e,
            languageId: a
        }).get()
    }
    getSummary(e, a) {
        return new AjaxRequest(TYPO3.settings.ajaxUrls.records_localize_summary).withQueryArguments({
            pageId: e,
            destLanguageId: a,
            languageId: this.sourceLanguage
        }).get()
    }
    localizeRecords(e, a, t) {
        return new AjaxRequest(TYPO3.settings.ajaxUrls.records_localize).withQueryArguments({
            pageId: e,
            srcLanguageId: this.sourceLanguage,
            destLanguageId: a,
            action: "deepl" === this.localizationMode ? deeplLocalizationMode : this.localizationMode, // forkchange
            uidList: t,
            deepl: "deepl" === this.localizationMode ? 1 : 0
        }).get()
    }
}
export default new LocalizationDeepl;
