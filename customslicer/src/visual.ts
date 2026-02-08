/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.extensibility.ISelectionId;
import * as d3 from "d3";

import { VisualSettings } from "./settings";

interface DataPoint {
    value: any;
    selectionId: ISelectionId;
    isAll?: boolean;
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private container: d3.Selection<HTMLDivElement, any, any, any>;
    private selectionManager: ISelectionManager;
    private host: powerbi.extensibility.visual.IVisualHost;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        
        this.container = d3.select(this.target)
            .append("div")
            .classed("container", true);
    }

    public update(options: VisualUpdateOptions) {
        console.log('[UPDATE] Method called', options);
        
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        
        const dataView = options.dataViews && options.dataViews[0];
        
        if (!dataView || !dataView.categorical || !dataView.categorical.categories) {
            console.log('[UPDATE] No data available');
            this.container.text("Drop data here");
            return;
        }
        
        const category = dataView.categorical.categories[0];
        const categoryValues = category.values;
        const styleSettings = this.settings.itemStyleProp;
        
        console.log('[UPDATE] Category values:', categoryValues);
        console.log('[UPDATE] Style settings:', styleSettings);
        
        // Update CSS variables
        this.container
            .style("--item-bg-color", styleSettings.backgroundColor)
            .style("--item-border-color", styleSettings.borderColor)
            .style("--item-text-color", styleSettings.textColor)
            .style("--item-border-width", styleSettings.borderWidth + "px")
            .style("--item-padding", styleSettings.padding + "px")
            .style("--item-margin", styleSettings.margin + "px")
            .style("--item-font-size", this.settings.dataPoint.fontSize + "px");
        
        // Create data points with selection IDs
        const dataPoints: DataPoint[] = [];
        
        // Add "All" option
        dataPoints.push({
            value: "All",
            selectionId: null,
            isAll: true
        });
        
        // Add category values
        for (let i = 0; i < categoryValues.length; i++) {
            const selectionId = this.host.createSelectionIdBuilder()
                .withCategory(category, i)
                .createSelectionId();
            
            dataPoints.push({
                value: categoryValues[i],
                selectionId: selectionId,
                isAll: false
            });
        }
        
        console.log('[UPDATE] Data points created:', dataPoints.length);
        
        this.container.selectAll(".item").remove();
        
        const items = this.container.selectAll("div")
            .data(dataPoints)
            .enter()
            .append("div")
            .classed("item", true)
            .classed("item-all", d => d.isAll)
            .text(d => {
                const prefix = d.isAll ? "[FILTER] " : "[ITEM] ";
                const value = d.value ? d.value.toString() : "(Blank)";
                return prefix + value;
            });
        
        // Add click handlers
        const self = this;
        items.on("click", function(d: DataPoint) {
            console.log('[CLICK] Item clicked:', d.value);
            const event = d3.event as MouseEvent;
            event.stopPropagation();
            
            if (d.isAll) {
                console.log('[CLICK] Clearing all selections');
                // Clear all filters
                self.selectionManager.clear();
                items.classed("selected", false);
                d3.select(this).classed("selected", true);
            } else {
                console.log('[CLICK] Selecting item:', d.value);
                // Toggle selection
                self.selectionManager.select(d.selectionId, event.ctrlKey || event.metaKey).then(() => {
                    console.log('[CLICK] Selection completed');
                    self.syncSelectionState(items);
                });
            }
        });
        
        // Sync selection state on load
        this.syncSelectionState(items);
        console.log('[UPDATE] Update complete');
    }
    
    private syncSelectionState(items: d3.Selection<HTMLDivElement, DataPoint, any, any>) {
        const selections = this.selectionManager.getSelectionIds() as ISelectionId[];
        
        if (!selections || selections.length === 0) {
            // No selection - highlight "All"
            items.classed("selected", d => d.isAll);
        } else {
            // Highlight selected items
            items.classed("selected", d => {
                if (d.isAll) return false;
                return selections.some(sel => {
                    return JSON.stringify(sel) === JSON.stringify(d.selectionId);
                });
            });
        }
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}