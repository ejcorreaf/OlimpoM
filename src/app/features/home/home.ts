// src/app/features/home/home.ts
import { Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero';
import { FeaturesTabsComponent } from './components/features-tabs/features-tabs';
import { NewsComponent } from './components/news/news';
import { TestimonialsComponent } from './components/testimonials/testimonials';
import { PricingPreviewComponent } from './components/pricing-preview/pricing-preview';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    FeaturesTabsComponent,
    NewsComponent,
    TestimonialsComponent,
    PricingPreviewComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {}