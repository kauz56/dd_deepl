<?php

namespace Dmitryd\DdDeepl\Hook;

/***************************************************************
*  Copyright notice
*
*  (c) 2023 Dmitry Dulepov <dmitry.dulepov@gmail.com>
*  All rights reserved
*
*  This script is part of the TYPO3 project. The TYPO3 project is
*  free software; you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation; either version 2 of the License, or
*  (at your option) any later version.
*
*  The GNU General Public License can be found at
*  http://www.gnu.org/copyleft/gpl.html.
*
*  This script is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  This copyright notice MUST APPEAR in all copies of the script!
***************************************************************/

use Dmitryd\DdDeepl\Service\DeeplTranslationService;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Backend\Utility\BackendUtility;
use TYPO3\CMS\Core\Http\ApplicationType;
use TYPO3\CMS\Core\Page\PageRenderer;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Extbase\Configuration\BackendConfigurationManager;

/**
 * This class contains a hook to the PageRenderer that injects our own JS & CSS in the Backend.
 *
 * @author Dmitry Dulepov <dmitry.dulepov@gmail.com>
 */
class InjectAdditionalResources
{
    private PageRenderer $pageRenderer;
    private BackendConfigurationManager $configurationManager;

    public function __construct(PageRenderer $pageRenderer, BackendConfigurationManager $configurationManager)
    {
        $this->pageRenderer = $pageRenderer;
        $this->configurationManager = $configurationManager;
    }

    public function inject(): void
    {
        $request = $GLOBALS['TYPO3_REQUEST'];
        /** @var ServerRequestInterface $request */
        if (ApplicationType::fromRequest($request)->isBackend()) {
            $ts = $this->configurationManager->getTypoScriptSetup($request);
            $ts = $ts['module.']['tx_dddeepl.'] ?? [];
            $settings = $ts['settings.'] ?? [];
            $this->pageRenderer->addInlineSetting('tx_dddeepl', 'settings', $settings);
            $pageTSConfig = BackendUtility::getPagesTSconfig($this->getPageId());
            $module = $request->getAttribute('module');
            /** @var \TYPO3\CMS\Backend\Module\Module $module */
            if ($module) {
                $moduleIdentifier = $module->getIdentifier();
                // Only within web_* and with the navigation component because we need the page id!
                // See https://github.com/dmitryd/dd_deepl/issues/9
                if (str_starts_with($moduleIdentifier, 'web_')) {
                    $isAvailable = $module->getNavigationComponent() && $this->isDeeplAvailable();
                    if ($moduleIdentifier === 'web_layout') {
                        // Page module
                        if ($isAvailable && $pageTSConfig['mod.']['web_layout.']['localization.']['enableDeepL'] ?? true) {
                            $this->pageRenderer->loadJavaScriptModule('@dmitryd/dd_deepl/Localization.js');
                            $this->pageRenderer->addInlineLanguageLabelFile('EXT:dd_deepl/Resources/Private/Language/locallang.xlf', 'TYPO3.lang.', 'TYPO3.lang.');
                        } else {
                            // Load the standard module
                            // See https://github.com/dmitryd/dd_deepl/issues/8#issuecomment-1807787504
                            $this->pageRenderer->loadJavaScriptModule('@typo3/backend/localization.js');
                        }
                    } else {
                        // List module
                        if ($isAvailable && $pageTSConfig['mod.']['web_list.']['localization.']['enableDeepL'] ?? true) {
                            // We could limit to "/module/web/list" but than EXT:news administration module will not get translation button, so we just add to all
                            $this->pageRenderer->loadJavaScriptModule('TYPO3/CMS/DdDeepl/ListLocalization');
                            $this->pageRenderer->addCssFile('EXT:dd_deepl/Resources/Public/Css/DdDeepl.css');
                            $this->pageRenderer->addInlineLanguageLabelFile('EXT:dd_deepl/Resources/Private/Language/locallang.xlf', 'TYPO3.lang.', 'TYPO3.lang.');
                        }
                    }
                }
            }
        }
    }

    /**
     * Fetches the current page id.
     *
     * @return int
     */
    protected function getPageId(): int
    {
        $pageId = $GLOBALS['TYPO3_REQUEST']->getParsedBody()['id'] ?? $GLOBALS['TYPO3_REQUEST']->getQueryParams()['id'] ?? null;
        if (!$pageId) {
            $request = $GLOBALS['TYPO3_REQUEST'];
            /** @var ServerRequestInterface $request */
            $site = $request->getAttribute('site');
            /** @var \TYPO3\CMS\Core\Site\Entity\Site $site */
            $pageId = $site->getRootPageId();
        }

        return (int)$pageId;
    }

    /**
     * Checks if DeepL is available. This function must be called only inside web_* modules!
     *
     * @return bool
     * @see https://github.com/dmitryd/dd_deepl/issues/9
     */
    protected function isDeeplAvailable(): bool
    {
        return GeneralUtility::makeInstance(DeeplTranslationService::class)->isAvailable();
    }
}
