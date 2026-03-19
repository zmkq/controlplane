import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSwitcher } from '@/components/language-switcher';
import { TranslationProvider } from '@/lib/i18n';
import { LOCALE_COOKIE_NAME } from '@/lib/locale';

describe('LanguageSwitcher', () => {
  it('updates document language and direction', async () => {
    const user = userEvent.setup();

    render(
      <TranslationProvider initialLang="en">
        <LanguageSwitcher />
      </TranslationProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'AR' }));

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=ar`);
  });
});
